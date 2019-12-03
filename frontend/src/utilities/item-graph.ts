import { extend } from 'lodash';

import { item } from '../jsonld/ns';
import { FlatLdDocument } from '../jsonld/json';
import Node from '../jsonld/node';
import Graph from '../jsonld/graph';
import { isNode } from './types';

export interface QueryParamsURI {
    predicate?: Node | string;
    object?: Node | string;
}

export interface QueryParamsLiteral {
    predicate?: Node | string;
    objectLiteral?: string;
}

/**
 * Pass these parameters to ItemGraph.query to fetch not only the
 * Nodes that match the given predicate and/or object, but also
 * related Nodes up to the given number of steps.
 *
 * Suppose that you fetch a Node, item:x, with the following triple.

        item:x oa:hasSelector item:y

 * If you pass traverse: 1, the response will not only include item:x,
 * but also all Nodes that appear in the object position in item:x.
 * In the above example, that includes at least item:y. Now suppose
 * that item:y has the following triple.

        item:y oa:hasStartSelector item:z

 * The traverse: 1 option means that you perform this step only once,
 * so item:z will not be included in the response. To repeat this step
 * and also include item:z, simply pass traverse: 2 instead.
 *
 * The revTraverse option performs a similar lookup but in reverse
 * direction. If you pass revTraverse: 1, the response will include
 * item:w if it has the following triple.

        item:w oa:hasTarget item:x

 * Traversal always yields whole Nodes.
 */
export interface TraversalParams {
    traverse?: number;
    revTraverse?: number;
}

export type QueryParams = (QueryParamsURI | QueryParamsLiteral) & TraversalParams;

function isURIQuery(params: QueryParams): params is QueryParamsURI {
    return (params as QueryParamsURI).object !== undefined;
}

function isLiteralQuery(params: QueryParams): params is QueryParamsLiteral {
    return (params as QueryParamsLiteral).objectLiteral !== undefined;
}

function asURI(source: Node | string): string {
    return isNode(source) ? source.id : source;
}

/**
 * Useful Collection subclass for interacting with the backend item
 * store.
 *
 * To save a new Node to an item store, run

    anItemStore.create(theNode | theAttributes)

 * this returns either `theNode` or a new Node constructed with
 * `theAttributes`. In both cases, the returned Node will emit an
 * 'error' event if creation fails. Wait for 'change:@id' before
 * using the Node as an attribute value for another Node.
 *
 * See also the query method below for querying the server.
 */
export default class ItemGraph extends Graph {
    /**
     * Replace the contents of this graph by all items at the backend
     * that match the given criteria.
     *
     * The request runs async. Wait for the 'sync' or 'update' event
     * or await the returned promise in order to use the results.
     */
    query(params: QueryParams): JQuery.jqXHR {
        const data: any = {};
        if (params.predicate) data.p = asURI(params.predicate);
        if (isURIQuery(params)) data.o = asURI(params.object);
        if (isLiteralQuery(params)) data.o_literal = params.objectLiteral;
        if (params.traverse) data.t = params.traverse;
        if (params.revTraverse) data.r = params.revTraverse;
        return this.fetch({data});
    }
}

extend(ItemGraph.prototype, {
    url: item(),
});

window['whatever'] = ItemGraph;
