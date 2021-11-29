/**
 * SemanticSearchView and its subviews work with an underlying data model,
 * which is rich enough to represent both the recursive user interface and the
 * recursive SPARQL query that is generated from it. In the current module, we
 * implement the SPARQL code generation from this common data model.
 *
 * We generate a useful, logically complete subset of SPARQL that lends itself
 * well to being constructed from the user interface. Specifically, we use
 * inverse and sequence property paths, `EXISTS` and `NOT EXISTS`, `UNION`,
 * pattern concatenation, and a handful of functions and operators.
 *
 * The default export of the module, `modelToQuery`, is the real interface.
 * Some other functions are exported as well, but only for unittesting purposes.
 */

import { map, find, uniqueId, partial, groupBy } from 'lodash';
import * as _ from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import {
    rdfs,
    owl,
    xsd,
    frbr,
    readit,
    item,
    nsMap as defaultNs,
    nsTable,
} from '../common-rdf/ns';
import ldChannel from '../common-rdf/radio';
import Node from '../common-rdf/node';

import queryTemplate from './query-template';

// SPARQL is essentially a bi-modal query language: query conditions can be
// either patterns (consisting of triples and delimited by curly braces) or
// expressions (built up from function calls and operators). Expressions can be
// injected into patterns using `FILTER` statements. Conversely, patterns can be
// nested inside expressions using the `EXISTS` function. The next three types
// enable us to distinguish between the two modes.

interface TaggedExpression {
    tag: 'expression';
    expression: string;
}

interface TaggedPattern {
    tag: 'pattern';
    pattern: string;
}

type TaggedSyntax = TaggedExpression | TaggedPattern;

/**
 * Return type of `_.groupBy(TaggedSyntax[], 'tag')`, useful for and/or.
 */
interface Branches {
    expression?: TaggedExpression[];
    pattern?: TaggedPattern[];
};

/**
 * Serialize an IRI either as `<http://full.url>` or as `ns:short`, depending
 * on available namespaces.
 */
export function serializeIri(iri: string, ns: nsTable): string {
    let short = '';
    find(ns, function(namespace, abbreviation) {
        const [lead, tail] = iri.split(namespace);
        if (tail && !lead) {
            // `namespace` is a proper prefix of `iri`
            short = `${abbreviation}:${tail}`;
            return true;
        }
    });
    return short || `<${iri}>`;
}

/**
 * Serialize a SPARQL-supported literal with a type in the `xsd` namespace.
 */
export function serializeLiteral(
    literal: string, datatype: string, ns: nsTable
): string {
    switch (datatype) {
    case xsd.dateTime:
        return `"${literal}"^^${serializeIri(datatype, ns)}`;
    case xsd.string:
        return `"${literal}"`;
    }
    // Assume number since that's the only other type SPARQL supports.
    return literal;
}

function nextVariable(): string {
    return uniqueId('?x');
}

/**
 * In the context of a predicate path, we write the IRI of an inverse property
 * as `^direct`. This is safer than always writing an inverse property as
 * itself, firstly because this is also how related items are saved to the
 * backend, and secondly because our frontend reasoner synthetically generates
 * some "pretend" inverse properties from their direct counterparts when no
 * existing inverse is found. The latter mechanism is implemented in
 * `../utilities/relation-utilities.ts`.
 */
export function serializePredicate(predicate: Node, ns: nsTable): string {
    const inverse = predicate.get(owl.inverseOf) as Node[];
    if (inverse && inverse.length) return `^${serializeIri(inverse[0].id, ns)}`;
    return serializeIri(predicate.id, ns);
}

function serializePath(predicates: Node[], ns: nsTable): string {
    return map(predicates, partial(serializePredicate, _, ns)).join(' / ');
}

function tagExpression(expression: string): TaggedExpression {
    return { tag: 'expression', expression };
}

function tagPattern(pattern: string): TaggedPattern {
    return { tag: 'pattern', pattern };
}

/**
 * Serialize one atomic building block of an expression: either a function call
 * with only literal or variable arguments, or a binary operator expression
 * with likewise operands. See `./dropdown-constants.ts` for the possible
 * filter models.
 */
export function serializeExpression(filter: Model, args: string[]): TaggedExpression {
    const func = filter.get('function') || '';
    const op = filter.get('operator');
    const sep = op ? ` ${op} ` : ', ';
    return tagExpression(`${func}(${args.join(sep)})`);
}

function patternAsExpression({ pattern }: TaggedPattern): TaggedExpression {
    return tagExpression(`EXISTS {\n${pattern}}`);
}

// Below, we generate two helpers for `combineAnd` and `combineOr`.
function joinTagged<K extends keyof Branches>(key: K) {
    return function(constituents: Branches[K], glue: string): string {
        return map(constituents, key).join(glue);
    }
}
const joinE = joinTagged('expression');
const joinP = joinTagged('pattern');

/**
 * Apply logical AND to combine a bunch of SPARQL snippets which have already
 * been pre-grouped by mode (expression/pattern). The resulting SPARQL snippet
 * may be either a pattern or an expression, depending on what went in.
 */
export function combineAnd({ expression, pattern }: Branches): TaggedSyntax {
    let exp = expression ? `${joinE(expression, ' && ')}` : '';
    if (expression && expression.length > 1) exp = `(${exp})`;
    const pat = pattern ? joinP(pattern, '') : '';
    if (exp) {
        if (pat) return tagPattern(`${pat}FILTER ${exp}\n`);
        return tagExpression(exp);
    }
    return tagPattern(pat);
}

/**
 * Apply logical OR to combine a bunch of SPARQL snippets which have already
 * been pre-grouped by mode (expression/pattern). The resulting SPARQL snippet
 * may be either a pattern or an expression, depending on what went in.
 */
export function combineOr({ expression, pattern }: Branches): TaggedSyntax {
    if (expression) {
        const patExp = expression.concat(
            pattern ? map(pattern, patternAsExpression) : []
        );
        const joined = `${joinE(patExp, ' || ')}`
        return tagExpression(patExp.length > 1 ? `(${joined})` : joined);
    }
    return tagPattern(`{\n${joinP(pattern, '} UNION {\n')}}\n`);
}

// Lookup table to save an `if`/`else` down the line.
const combine = {
    and: combineAnd,
    or: combineOr,
};

/**
 * Apply logical NOT to a SPARQL snippet which may be of either mode
 * (expression/pattern). The result is always an expression; patterns need to
 * be converted to expression first because they cannot be negated directly.
 */
function negate(syntax: TaggedSyntax): TaggedExpression {
    return tagExpression(
        syntax.tag === 'expression' ?
        `!(${syntax.expression})` :
        `NOT EXISTS {\n${syntax.pattern}}`
    );
}

/**
 * Core recursive pattern/expression builder, representing an entire chain
 * (row) from the UI, including any subchains that branch out from it. The
 * recursion is depth-first and pre-order, so that the smallest constituents
 * determine the mode of their containing constituents.
 */
export function serializeChain(
    entry: Model, variableIn: string, ns: nsTable, index: number = 0
): TaggedSyntax {
    const chain = entry.get('chain');
    if (!chain) return;
    let lastAssertedType = '';
    const predicates: Node[] = [];
    const args: string[] = [];
    let variableOut: string = variableIn;
    // Conceptually, a chain consists of zero or more property traversals,
    // optionally recursing on logical operators. Eventually, chains always
    // terminate with a filter. `tail` will contain the SPARQL syntax that
    // results either from recursion or termination. The purpose of the loop
    // below is to accumulate the properties to traverse until the `tail` is
    // found.
    let tail: TaggedSyntax;
    while (index < chain.length) {
        const model = chain.at(index);
        const scheme = model.get('scheme');
        if (scheme === 'logic') {
            // Logic, recurse.
            const branches = model.get('branches');
            const action = model.get('action');
            if (branches) {
                tail = serializeBranchout(branches, action, variableOut, ns);
            } else {
                tail = serializeChain(entry, variableOut, ns, index + 1);
                if (action === 'not') tail = negate(tail);
                break;
            }
        } else if (scheme === 'filter') {
            // Filter, build expression as `tail`.
            const value = model.get('value');
            const datatype = model.get('range').at(0).id;
            args.push(variableOut);
            if (value) args.push(
                datatype.startsWith(xsd()) ?
                serializeLiteral(value, datatype, ns) :
                serializeIri(value, ns)
            );
            tail = serializeExpression(model.get('filter'), args);
        } else if (model.get('traversal')) {
            // Add another property to traverse.
            predicates.push(model.get('selection'));
            if (variableOut === variableIn) variableOut = nextVariable();
        } else if (model.get('assertion')) {
            lastAssertedType = model.get('selection').id;
        }
        // You may wonder why there is no final `else` clause. The reason is
        // that filter selections only serve a purpose for the UI. Those are
        // always followed by another model with `scheme === 'filter'`.
        ++index;
    }
    if (!tail) throw new RangeError(
        `Incomplete chain: ${JSON.stringify(chain, null, 4)}`
    );
    let head = '';
    if (predicates.length) {
        head = `${variableIn} ${serializePath(predicates, ns)} ${variableOut}.\n`;
    } else {
        if (!lastAssertedType || tail.tag === 'pattern') return tail;
        head = `${variableIn} a ${serializeIri(lastAssertedType, ns)}.\n`
    }
    return tagPattern(
        tail.tag === 'expression' ?
        `${head}FILTER ${tail.expression}\n` :
        `${head}${tail.pattern}`
    );
}

/**
 * Recursion helper for `serializeChain` that accumulates the results when
 * branching out over multiple subchains by and/or.
 */
function serializeBranchout(
    branches: Collection, action: string, variableIn: string, ns: nsTable
): TaggedSyntax {
    if (!branches.length) throw RangeError('Empty branchout');
    const recursive = branches.map(
        partial(serializeChain, _, variableIn, ns, 0)
    );
    const segments = groupBy(recursive, 'tag');
    return combine[action](segments);
}

/**
 * Convert the data model into a complete `CONSTRUCT` query including prefix
 * headers.
 */
export default function modelToQuery(
    entry: Model, namespaces: nsTable = defaultNs
): string {
    const chain = serializeChain(entry, '?item', namespaces);
    const body = (
        chain.tag === 'expression' ?
        `FILTER ${chain.expression}` :
        chain.pattern
    );
    const sourceGraph = serializeIri(item(), namespaces);
    return queryTemplate({ namespaces, body, sourceGraph });
}
