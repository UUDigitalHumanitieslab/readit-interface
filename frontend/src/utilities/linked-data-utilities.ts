import { find, includes, map, compact, some, isString } from 'lodash';

import ldChannel from '../common-rdf/radio';
import { Identifier, isIdentifier } from '../common-rdf/json';
import Node, { isNode, NodeLike } from '../common-rdf/node';
import Graph, { ReadOnlyGraph } from '../common-rdf//graph';
import { skos, rdfs, readit, dcterms, owl, schema } from '../common-rdf/ns';

export const labelKeys = [skos.prefLabel, rdfs.label, skos.altLabel, readit('name'), dcterms.title];

/**
 * Get a label from the node.
 */
export function getLabel(node: Node): string {
    let labelKey = find(labelKeys, key => node.has(key));
    if (labelKey) return node.get(labelKey)[0] as string;
    return getLabelFromId(node.get('@id'));
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

/**
 * Create a css class name based on the node's label.
 * Returns null if no label is found.
 */
export function getCssClassName(node: Node): string {
    if (!node) return undefined;
    let label = getLabel(node);

    if (label) {
        label = label.replace(new RegExp(' ', 'g'), '').replace(new RegExp('[\(\)\/]', 'g'), '').toLowerCase();
        return `is-readit-${label}`;
    }

    return null;
}

/**
 * Helper to obtain the URI of something that may be either a Node or
 * already a URI.
 */
export function asURI(source: Node | string): string {
    return isNode(source) ? source.id : source;
}

/**
 * Check if a node is a rdfs:Class, i.e. has rdfs:Class or owl:Class as (one of its) type(s) or
 * has a non-empty rdfs:subClassOf property.
 * @param node The node to evaluate
 */
export function isRdfsClass(node: Node): boolean {
    return node.has(rdfs.subClassOf) || node.has('@type', owl.Class) || node.has('@type', rdfs.Class);
}

/**
 * Check if a node is an annotation category used in the class picker when editing annotations.
 * @param node The node to evaluate
 */
export function isAnnotationCategory(node: Node): boolean {
    return isRdfsClass(node) && node.has(schema.color) && !(node.get(owl.deprecated));
}

/**
 * A GraphTraversal is a function that takes a single Node and
 * returns an array of Nodes.
 * (Most useful if the returned Nodes are somehow related to the
 * input Node.)
 */
export interface GraphTraversal {
    (node: Node): Node[];
}

/**
 * Collect all Nodes that are connected by a given relationship.
 * "Transitive" means that you follow a relationship repeatedly. For
 * example, when you take the parents of your parents, you get your
 * grandparents; this is transitively following the "parent-of"
 * relationship.
 * "Closure" is here meant in the set-theoretic sense: the complete
 * set of all things that are connected by a given relationship.
 * The transitive closure over parent-of, starting from you, is the
 * complete set of all your ancestors.
 * For an example of usage, see the getRdfSuperClasses source code.
 * @param seeds the Nodes from which to start following the relationship.
 * @param traverse a function that, given a Node, returns its related Nodes.
 * @return a deduplicated array of all related Nodes, including the seeds.
 */
export function transitiveClosure(
    seeds: Node[],
    traverse: GraphTraversal
): Node[] {
    const fringe = new Graph(seeds);
    const newlyFound = new Graph();
    const finished = new Graph();
    const addRelated = node => (
        node && newlyFound.add(compact(traverse(node)))
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
 * Get all known RDF classes that are ancestors of the passed class(es).
 * "Known" here means that only the information that is synchronously
 * available from the store is taken into account, although classes
 * that were not previously in the store will be fetched as a side
 * effect.
 * @param clss (URIs of) RDF classes of which to obtain all ancestors.
 * @return a deduplicated array of all ancestors of clss, including clss.
 */
export function getRdfSuperClasses(clss: NodeLike[]): Node[] {
    if (!clss || clss.length === 0) return clss as Node[];
    const seed = map(clss, cls => ldChannel.request('obtain', cls));
    // Next lines handle test environments without a store.
    if (seed[0] == null) return clss.map(cls =>
        isNode(cls) ? cls : new Node(isIdentifier(cls) ? cls : {'@id': cls})
    );

    function traverseParents(cls) {
        const getDirectParents = store => store.get(cls).get(rdfs.subClassOf);
        return ldChannel.request('visit', getDirectParents);
    }

    return transitiveClosure(seed, traverseParents);
}

/**
 * Get all known RDF classes that are descendants of the passed class(es).
 * "Known" here means that only the information that is synchronously
 * available from the store is taken into account, although classes
 * that were not previously in the store will be fetched as a side
 * effect.
 * @param clss (URIs of) RDF classes of which to obtain all descendants.
 * @return a deduplicated array of all descendants of clss, including clss.
 */
export function getRdfSubClasses(clss: NodeLike[]): Node[] {
    if (!clss || clss.length === 0) return clss as Node[];
    const seed = map(clss, cls => ldChannel.request('obtain', cls));
    // Next lines handle test environments without a store.
    if (seed[0] == null) return clss.map(cls =>
        isNode(cls) ? cls : new Node(isIdentifier(cls) ? cls : {'@id': cls})
    );

    function traverseChildren(cls) {
        return ldChannel.request('visit', store => store.filter({
            [rdfs.subClassOf]: cls,
        }));
    }

    return transitiveClosure(seed, traverseChildren);
}

/**
 * Check if a Node is an instance of (a subclass of) a specific type.
 * @param node The node to inspect.
 * @param type The expected type, e.g. (schema.CreativeWork).
 * @return true if node is an instance of type, false otherwise.
 */
export function isType(node: Node, type: string): boolean {
    const initialTypes = node.get('@type') as string[];
    if (!initialTypes) return false;
    const allTypes = getRdfSuperClasses(initialTypes);
    return some(allTypes, {'id': type});
}

/**
 * Check whether a Node is blank.
 * A blank node is a node that is neither a literal nor a URI. Note that this is different from a Node without an @id; this occurs only if the Node in question was created on the client side and was never saved to a server. The latter situation can be checked using aNode.isNew(). Such a Node may become either a URI or a blank node after saving. Saved blank nodes get a temporary placeholder @id from the parser, which serves to distinguish it from other blank nodes but which is not a valid URI. Conventionally, these temporary @ids start with `_:`. This function detects the latter situation.
 */
export function isBlank(node: Node) {
    if (!node.id) return false;
    return node.id.startsWith('_:');
}

/**
 * Establish whether a node is in the ontology graph, i.e. is an ontology class
 * (as opposed to an instance of one of the ontology's classes).
 * Note: this is too restrictive, ontology classes are not necessarily in the
 * READIT namespace. This function is not used in the application, so WONTFIX for now.
 * @param node The linked data item to investigate.
 */
export function isOntologyClass(node: Node): boolean {
    if (!isRdfsClass(node)) return false;
    if (node.id) return (node.id as string).startsWith(readit());
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
