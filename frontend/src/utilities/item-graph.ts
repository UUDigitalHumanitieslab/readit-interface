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

export type QueryParams = QueryParamsURI | QueryParamsLiteral;

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
        return this.fetch({data});
    }
}

extend(ItemGraph.prototype, {
    url: item(),
});
