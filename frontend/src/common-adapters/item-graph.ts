import { extend } from 'lodash';

import { item } from '../common-rdf/ns';
import { FlatLdDocument } from '../common-rdf/json';
import Node, { isNode } from '../common-rdf/node';
import Graph from '../common-rdf/graph';
import { asURI } from '../utilities/linked-data-utilities';

import { sparqlRoot } from 'config.json';
const sparqlItemsEndpoint = sparqlRoot + 'item/query'

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

        item:x oa:hasTarget item:y

 * If you pass traverse: 1, the response will not only include item:x,
 * but also all Nodes that appear in the object position in item:x.
 * In the above example, that includes at least item:y. Now suppose
 * that item:y has the following triple.

        item:y oa:hasSelector item:z

 * The traverse: 1 option means that you perform this step only once,
 * so item:z will not be included in the response. To repeat this step
 * and also include item:z, simply pass traverse: 2 instead.
 *
 * The revTraverse option performs a similar lookup but in reverse
 * direction. If you pass revTraverse: 1, the response will include
 * item:w if it has the following triple.

        item:w oa:hasBody item:x

 * Traversal always yields whole Nodes.
 */
export interface TraversalParams {
    traverse?: number;
    revTraverse?: number;
}

export interface DownloadParam {
    download?: boolean;
}

export type QueryParams = (QueryParamsURI | QueryParamsLiteral) & TraversalParams & DownloadParam;

function isURIQuery(params: QueryParams): params is QueryParamsURI {
    return (params as QueryParamsURI).object !== undefined;
}

function isLiteralQuery(params: QueryParams): params is QueryParamsLiteral {
    return (params as QueryParamsLiteral).objectLiteral !== undefined;
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
    // Only defined if a query has been issued.
    promise: JQuery.jqXHR;

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
        if (params.download) data.download = params.download;
        if (params.traverse) data.t = params.traverse;
        if (params.revTraverse) data.r = params.revTraverse;
        return this.promise = this.fetch({data});
    }

    sparqlQuery(query: string): JQuery.jqXHR {
        return this.promise = this.fetch({ url: sparqlItemsEndpoint, data: $.param({ query: query }), remove: false });
    }

    /**
     * Invokes the given callback when the most recent query completes.
     */
    ready(callback: (ItemGraph) => any): this {
        if (!this.promise) throw new Error('No query was issued.');
        this.promise.then(callback);
        return this;
    }
}

extend(ItemGraph.prototype, {
    url: item(),
});

if (window['DEBUGGING']) {
    window['ItemGraph'] = ItemGraph;
}
