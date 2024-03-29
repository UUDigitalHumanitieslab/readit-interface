import { find, findKey, map, compact, some, isString } from 'lodash';
import * as i18next from 'i18next';

import ldChannel from '../common-rdf/radio';
import { isIdentifier } from '../common-rdf/json';
import Subject, { isSubject, SubjectLike } from '../common-rdf/subject';
import Graph from '../common-rdf//graph';
import {
    nlp, skos, rdf, rdfs, readit, dcterms, owl, schema, nsMap,
} from '../common-rdf/ns';

export const labelKeys = [skos.prefLabel, rdfs.label, skos.altLabel, readit('name'), dcterms.title];

/**
 * Get a label from the subject.
 */
export function getLabel(subject: Subject): string {
    let labelKey = find(labelKeys, key => subject.has(key));
    if (labelKey) return subject.get(labelKey, {
        '@language': i18next.languages,
    })[0] as string;
    return getLabelFromId(subject.get('@id'));
}

/**
 * Extract a label for an item or from a property name.
 * @param id the string representing the id of a linked data item.
 */
export function getLabelFromId(id: string) {
    if (!isString(id)) return;
    let index = id.lastIndexOf("#");
    if (index === -1) index = id.lastIndexOf("/");
    return id.substring(index + 1);
}

// Memoize abbreviated turtle terms for efficiency.
const turtleCache = {};

/**
 * Obtain ns:term notation for terms in known namespaces.
 * Falls back to <http(s)://full-uri> notation for URIs in unknown namespaces.
 */
export function getTurtleTerm(term: string | Subject): string {
    const uri = asURI(term);
    const memoizedTerm = turtleCache[uri];
    if (memoizedTerm) return memoizedTerm;
    const prefix = findKey(nsMap, p => uri.startsWith(p));
    if (prefix) {
        const length = nsMap[prefix].length;
        return turtleCache[uri] = `${prefix}:${uri.slice(length)}`;
    }
    return `<${uri}>`;
}

// We memoize CSS classes so we don't have to recompute class names for the same
// classes over and over. Exported so we can clear it in tests.
export const cssClassCache = {};

// These characters are removed in getCssClassName below.
const normalizePattern = /[ \(\)\/]/g;

/**
 * Create a css class name based on the subject's label.
 * Returns null if no label is found.
 */
export function getCssClassName(subject: Subject): string {
    if (!subject) return undefined;
    const id = subject.id as string;
    const className = cssClassCache[id];
    if (className) return className;

    let label = getLabel(subject);
    if (label) {
        label = label.replace(normalizePattern, '').toLowerCase();
        if (id && id.startsWith(nlp())) {
            return cssClassCache[id] = `is-nlp-${label}`;
        } else {
            return cssClassCache[id] = `is-readit-${label}`;
        }
    }

    return null;
}

/**
 * Helper to obtain the URI of something that may be either a Subject or
 * already a URI.
 */
export function asURI(source: Subject | string): string {
    return isSubject(source) ? source.id as string : source;
}

/**
 * Check if a subject is a rdfs:Class, i.e., has rdfs:Class or owl:Class as (one of
 * its) type(s) or has a non-empty rdfs:subClassOf property.
 * @param subject The subject to evaluate
 */
export function isRdfsClass(subject: Subject): boolean {
    return subject.has(rdfs.subClassOf) || subject.has('@type', owl.Class) || subject.has('@type', rdfs.Class);
}

/**
 * Check if a subject is a rdf:Property, i.e., has rdf:Property or
 * owl:ObjectProperty as (one of its) type(s) or has a non-empty
 * rdfs:subPropertyOf or owl:inverseOf property.
 * @param subject The subject to evaluate
 */
export function isRdfProperty(subject: Subject): boolean {
    return subject.has(rdfs.subPropertyOf) || subject.has(owl.inverseOf) || subject.has('@type', rdf.Property) || subject.has('@type', owl.ObjectProperty);
}

/**
 * Check whether a subject is both colored and a class. A middle ground between
 * `isRdfsClass` and `isAnnotationCategory`.
 */
export function isColoredClass(subject: Subject): boolean {
    return subject.has(schema.color) && isRdfsClass(subject);
}

/**
 * Check if a subject is an annotation category used in the class picker when
 * editing annotations.
 * @param subject The subject to evaluate
 */
export function isAnnotationCategory(subject: Subject): boolean {
    return isColoredClass(subject) && !(subject.get(owl.deprecated));
}

/**
 * A GraphTraversal is a function that takes a single Subject and
 * returns an array of Subjects.
 * (Most useful if the returned Subjects are somehow related to the
 * input Subject.)
 */
export interface GraphTraversal {
    (subject: Subject): Subject[];
}

/**
 * Collect all Subjects that are connected by a given relationship.
 * "Transitive" means that you follow a relationship repeatedly. For
 * example, when you take the parents of your parents, you get your
 * grandparents; this is transitively following the "parent-of"
 * relationship.
 * "Closure" is here meant in the set-theoretic sense: the complete
 * set of all things that are connected by a given relationship.
 * The transitive closure over parent-of, starting from you, is the
 * complete set of all your ancestors.
 * For an example of usage, see the predicateClosure source code.
 * @param seeds the Subjects from which to start following the relationship.
 * @param traverse a function that, given a Subject, returns its related Subjects.
 * @return a deduplicated array of all related Subjects, including the seeds.
 */
export function transitiveClosure(
    seeds: Subject[],
    traverse: GraphTraversal
): Subject[] {
    const fringe = new Graph(seeds);
    const newlyFound = new Graph();
    const finished = new Graph();
    const addRelated = subject => (
        subject && newlyFound.add(compact(traverse(subject)))
    );

    while (!fringe.isEmpty()) {
        fringe.forEach(addRelated);
        finished.add(fringe.models);
        newlyFound.remove(finished.models);
        fringe.reset(newlyFound.models);
    }

    return finished.models;
}

/**
 * Where transitiveClosure is still quite abstract, predicateClosure generates
 * a function that applies transitiveClosure with a predicate as the
 * relationship. You must specify whether the predicate should be followed in
 * the subject-to-object (S2O) or object-to-subject (O2S) direction.
 * This function factory contains the common underlying implementation of
 * getRdfSuperClasses, getRdfSubClasses and getRdfSuperProperties. See their
 * documentation comments below for further details about the semantics of the
 * generated function.
 * @param predicate The predicate that will serve as the relationship.
 * @param direction The direction in which to traverse the predicate.
 * @return a function that takes an array of Subjects and returns the combined,
 *         deduplicated transitive closures of all Subjects in the input array.
 */
function predicateClosure(predicate: string, direction: 'S2O' | 'O2S') {
    function traverseS2O(cls) {
        const getObjects = store => store.get(cls).get(predicate);
        return ldChannel.request('visit', getObjects);
    }

    function traverseO2S(cls) {
        const getSubjects = store => store.filter({ [predicate]: cls });
        return ldChannel.request('visit', getSubjects);
    }

    const traverse = direction === 'S2O' ? traverseS2O : traverseO2S;

    return function(clss: SubjectLike[]): Subject[] {
        if (!clss || clss.length === 0) return clss as Subject[];
        const seed = map(clss, cls => ldChannel.request('obtain', cls));
        // Next lines handle test environments without a store.
        if (seed[0] == null) return clss.map(cls =>
            isSubject(cls) ? cls : new Subject(
                isIdentifier(cls) ? cls : { '@id': cls }
            )
        );
        return transitiveClosure(seed, traverse);
    };
}

/**
 * Get all known RDF classes that are ancestors of the passed class(es).
 * "Known" here means that only the information that is synchronously
 * available from the store is taken into account, although classes
 * that were not previously in the store will be fetched as a side
 * effect.
 * @param clss (URIs of) RDF classes of which to obtain all ancestors.
 * @return a deduplicated array of all ancestors of clss, including clss.
 */
export const getRdfSuperClasses = predicateClosure(rdfs.subClassOf, 'S2O');

/**
 * Get all known RDF classes that are descendants of the passed class(es).
 * "Known" here means that only the information that is synchronously
 * available from the store is taken into account, although classes
 * that were not previously in the store will be fetched as a side
 * effect.
 * @param clss (URIs of) RDF classes of which to obtain all descendants.
 * @return a deduplicated array of all descendants of clss, including clss.
 */
export const getRdfSubClasses = predicateClosure(rdfs.subClassOf, 'O2S');

/**
 * Get all known RDF properties that are ancestors of the passed
 * property/properties.
 * "Known" here means that only the information that is synchronously
 * available from the store is taken into account, although properties
 * that were not previously in the store will be fetched as a side
 * effect.
 * @param props (URIs of) RDF properties of which to obtain all ancestors.
 * @return a deduplicated array of all ancestors of props, including props.
 */
export
const getRdfSuperProperties = predicateClosure(rdfs.subPropertyOf, 'S2O');

/**
 * Check if a Subject is an instance of (a subclass of) a specific type.
 * @param subject The subject to inspect.
 * @param type The expected type, e.g. (schema.CreativeWork).
 * @return true if subject is an instance of type, false otherwise.
 */
export function isType(subject: Subject, type: string): boolean {
    const initialTypes = subject.get('@type') as string[];
    if (!initialTypes) return false;
    const allTypes = getRdfSuperClasses(initialTypes);
    return some(allTypes, { 'id': type });
}

/**
 * Check whether a Subject is blank.
 * A blank node is a subject that is neither a literal nor a URI. Note that this is different from a Subject without an @id; this occurs only if the Subject in question was created on the client side and was never saved to a server. The latter situation can be checked using aSubject.isNew(). Such a Subject may become either a URI or a blank subject after saving. Saved blank nodes get a temporary placeholder @id from the parser, which serves to distinguish it from other blank nodes but which is not a valid URI. Conventionally, these temporary @ids start with `_:`. This function detects the latter situation.
 */
export function isBlank(subject: Subject) {
    if (!subject.id) return false;
    return (subject.id as string).startsWith('_:');
}

/**
 * Establish whether a subject is in the ontology graph, i.e. is an ontology class
 * (as opposed to an instance of one of the ontology's classes).
 * Note: this is too restrictive, ontology classes are not necessarily in the
 * READIT namespace. This function is not used in the application, so WONTFIX for now.
 * @param subject The linked data item to investigate.
 */
export function isOntologyClass(subject: Subject): boolean {
    if (!isRdfsClass(subject)) return false;
    if (subject.id) return (subject.id as string).startsWith(readit());
    return false;
}

/**
 * Adapts the ontology promise from the ld radio channel to the async
 * callback convention.
 */
export function getOntology(callback): void {
    ldChannel.request('ontology:promise').then(
        function success(o) {
            callback(null, o);
        },
        /*error*/ callback
    );
}

/**
 * Shorthand version of ldChannel.request('obtain') that can be used as a
 * callback.
 */
export function obtain(id) {
    return ldChannel.request('obtain', id);
}
