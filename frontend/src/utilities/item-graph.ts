import { extend } from 'lodash';

import { item } from '../jsonld/ns';
import { FlatLdDocument } from '../jsonld/json';
import Node from '../jsonld/node';
import Graph from '../jsonld/graph';
import { isNode } from './types';

export interface QueryParams {
    predicate?: Node;
    object?: Node | string;
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
    query({predicate, object}: QueryParams): JQuery.jqXHR {
        const data: any = {};
        if (predicate) data.p = predicate.id;
        if (object) {
            if (isNode(object)) {
                data.o = object.id;
            } else {
                data.o_literal = object;
            }
        }
        return this.fetch({data});
    }
}

extend(ItemGraph.prototype, {
    url: item(),
});
