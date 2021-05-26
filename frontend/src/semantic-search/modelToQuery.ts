import { map, find, uniqueId, partial, groupBy } from 'lodash';
import * as _ from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import { rdfs, owl, xsd, frbr, readit, item } from '../common-rdf/ns';
import ldChannel from '../common-rdf/radio';
import Node from '../common-rdf/node';

import queryTemplate from './query-template';

interface nsTable {
    [abbreviation: string]: string;
}

interface TaggedExpression {
    tag: 'expression';
    expression: string;
}

interface TaggedPattern {
    tag: 'pattern';
    pattern: string;
}

type TaggedSyntax = TaggedExpression | TaggedPattern;

interface Branches {
    expression?: TaggedExpression[];
    pattern?: TaggedPattern[];
};

const defaultNs = {
    rdfs: rdfs(),
    owl: owl(),
    readit: readit(),
    item: item(),
};

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

export function serializeLiteral(
    literal: string, datatype: string, ns: nsTable
): string {
    switch (datatype) {
    case xsd.dateTime:
        return `"${literal}"^^${serializeIri(datatype, ns)}`;
    case xsd.string:
        return `"${literal}"`;
    }
    return literal;
}

function nextVariable(): string {
    return uniqueId('?x');
}

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

export function serializeExpression(filter: Model, args: string[]): TaggedExpression {
    const func = filter.get('function') || '';
    const op = filter.get('operator');
    const sep = op ? ` ${op} ` : ', ';
    return tagExpression(`${func}(${args.join(sep)})`);
}

function patternAsExpression({ pattern }: TaggedPattern): TaggedExpression {
    return tagExpression(`EXISTS {\n${pattern}}`);
}

function joinTagged<K extends keyof Branches>(key: K) {
    return function(constituents: Branches[K], glue: string): string {
        return map(constituents, key).join(glue);
    }
}
const joinE = joinTagged('expression');
const joinP = joinTagged('pattern');

export function combineAnd({ expression, pattern }: Branches): TaggedSyntax {
    const exp = expression ? `(${joinE(expression, ' && ')})` : '';
    const pat = pattern ? joinP(pattern, '') : '';
    if (exp) {
        if (pat) return tagExpression(`${pat}FILTER ${exp}\n`);
        return tagExpression(exp);
    }
    return tagPattern(pat);
}

export function combineOr({ expression, pattern }: Branches): TaggedSyntax {
    if (expression) {
        const patExp = pattern ? map(pattern, patternAsExpression) : [];
        return tagExpression(`${joinE(expression.concat(patExp), ' || ')}`);
    }
    return tagPattern(`{\n${joinP(pattern, '} UNION {\n')}}`);
}

const combine = {
    and: combineAnd,
    or: combineOr,
};

function negate(syntax: TaggedSyntax): TaggedExpression {
    return tagExpression(
        syntax.tag === 'expression' ?
        `!(${syntax.expression})` :
        `NOT EXISTS {\n${syntax.pattern}}`
    );
}

function serializeChain(
    entry: Model, variableIn: string, ns: nsTable, index: number = 0
): TaggedSyntax {
    const chain = entry.get('chain');
    if (!chain) return;
    const predicates: Node[] = [];
    const args: string[] = [];
    let variableOut: string = variableIn;
    let tail: TaggedSyntax;
    while (index < chain.length) {
        const model = chain.at(index);
        const scheme = model.get('scheme');
        if (scheme === 'logic') {
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
            predicates.push(model.get('selection'));
            if (variableOut === variableIn) variableOut = nextVariable();
        }
        ++index;
    }
    if (!tail) throw new RangeError(
        `Incomplete chain: ${JSON.stringify(chain, null, 4)}`
    );
    if (!predicates.length) return tail;
    const head = `${variableIn} ${serializePath(predicates, ns)} ${variableOut}.\n`;
    return tagPattern(
        tail.tag === 'expression' ?
        `${head}FILTER ${tail.expression}\n` :
        `${head}${tail.pattern}`
    );
}

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

const explodeNs = (prefix, label) => ({ label, prefix });

export default function modelToQuery(
    entry: Model, ns: nsTable = defaultNs
): string {
    const chain = serializeChain(entry, '?item', ns);
    const body = (
        chain.tag === 'expression' ?
        `FILTER ${chain.expression}` :
        chain.pattern
    );
    const namespaces = map(ns, explodeNs);
    const sourceGraph = serializeIri(item(), ns);
    return queryTemplate({ namespaces, body, sourceGraph });
}
