import { find, includes, map, compact, some, isString } from 'lodash';

import ldChannel from '../jsonld/radio';
import { Identifier, isIdentifier } from '../jsonld/json';
import Node, { isNode, NodeLike } from '../jsonld/node';
import Graph, { ReadOnlyGraph } from './../jsonld/graph';
import ItemGraph from './item-graph';
import { skos, rdfs, readit, dcterms } from './../jsonld/ns';
import SourceView from '../panel-source/source-view';

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
    let result;
    let index = id.lastIndexOf("#");
    if (index === -1) index = id.lastIndexOf("/");
    if (index) result = id.substring(index + 1);
    return result;
}

/**
 * Create a css class name based on the node's label.
 * Returns null if no label is found.
 */
export function getCssClassName(node: Node): string {
    if (!node) return undefined;
    let label = getLabel(node);

    if (label) {
        label = label.replace(new RegExp(' ', 'g'), '').toLowerCase();
        return `is-readit-${label}`;
    }

    return null;
}

/**
 * Check if a node is a rdfs:Class, i.e. has rdfs:Class as (one of its) type(s) or
 * has a non-empty rdfs:subClassOf property.
 * @param node The node to evaluate
 */
export function isRdfsClass(node: Node): boolean {
    return node.has(rdfs.subClassOf) || node.has('@type', rdfs.Class);
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
 * Get the scroll top for a 'scrollTo' element that needs to scrolled to within a scrollable element.
 * Will position scrollTo at the top of the scrollable if scrollTo is heigher than scrollable, and center
 * it vertically otherwise.
 * @param scrollableEl The element that is scrollable, i.e. has overflow-y: scroll (or similar)
 * @param scrollToTop The top of the scrollTo element.
 * @param scrollToHeight The height of the scrollTo element.
 */
export function getScrollTop(scrollableEl: JQuery<HTMLElement>, scrollToTop: number, scrollToHeight: number) {
    // base position: show start at the top
    let scrollTop = scrollToTop - scrollableEl.offset().top + scrollableEl.scrollTop();

    if (scrollToHeight < scrollableEl.height()) {
        // center it
        let centerOffset = (scrollableEl.height() - scrollToHeight) / 2;
        scrollTop = scrollTop - centerOffset;
    }
    return scrollTop;
}

/**
 * Establish whether the item is in the ontology graph, i.e. is an ontology class
 * (as opposed to an instance of one of the ontology's classes).
 * @param item The linked data item to investigate.
 */
export function isOntologyClass(item: Node): boolean {
    return (item.id as string).startsWith(readit()) && isRdfsClass(item);
}


export function getOntology(callback): void {
    let o = new Graph();
    o.fetch({ url: readit() }).then(
        function success() {
            callback(null, o);
        },
        /*error*/ callback
    );
}

/**
 * Get an ItemGraph with all oa:Annotations, oa:SpecificResources,
 * oa:TextQuoteSelectors, vocab:RangeSelectors and oa:XPathSelectors
 * associated with the specified source.
 */
export function getItems(source: Node, callback): void {
    const items = new ItemGraph();
    items.query({ object: source, traverse: 2, revTraverse: 1 }).then(
        function success() {
            callback(null, items);
        },
        /*error*/ callback
    );
}

export function getSources(callback): void {
    const sources = new Graph();
    sources.fetch({ url: '/source/' }).then(
        function succes() {
            callback(null, sources);
        },
        /*error*/ callback
    );
}

/**
 * Create an instance of SourceView for the specified source.
 * Will collect the annotations associated with the source async, i.e.
 * these will be added to the SourceView's collection when ready.
 */
export function createSourceView(
    source: Node,
    showHighlightsInitially?: boolean,
    isEditable?: boolean,
    initialScrollTo?: Node
): SourceView {
    let sourceItems = new Graph();

    getItems(source, function (error, items) {
        if (error) console.debug(error)
        else {
            if (items.length > 0) sourceItems.add(items.models);
            else sourceView.processNoInitialHighlights();
        }
    });

    let sourceView = new SourceView({
        collection: sourceItems,
        model: source,
        showHighlightsInitially: showHighlightsInitially,
        isEditable: isEditable,
        initialScrollTo: initialScrollTo,
    });

    return sourceView;
}
