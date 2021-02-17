/**
 * This module provides a caching service for client code that
 * requires a particular type of item from the backend store. The
 * service operates through the ld radio channel. All requests return
 * an ItemGraph that will eventually contain the requested items. If
 * client code must only run when the request is complete, it can
 * pass a callback to the ItemGraph's .ready method or listen for the
 * 'sync' or 'update' event.

    ldChannel.request('cache:items', rdfClass: Node | uri)

 * Fetches all items of type `rdfClass`.

    ldChannel.request('cache:inverse-related', item: Node | uri)

 * Fetches all items inverse-related to `item`, i.e., all items that
 * have a triple in which `item` takes the object role.
 */

import ldChannel from '../common-rdf/radio';
import { rdf } from '../common-rdf/ns';
import Node, { isNode } from '../common-rdf/node';
import ItemGraph, { QueryParams } from '../common-adapters/item-graph';
import { asURI } from '../utilities/linked-data-utilities';

/**
 * Service names, used both in channel binding and cache key lookup.
 */
const byClass = 'items';
const inverse = 'inverse-related';

interface Cache {
    [id: string]: ItemGraph;
}

const cache: Cache = {};

/**
 * Issue a new request or return a Graph that was requested before.
 */
function ensureCache(key: string, params: QueryParams) {
    let items = cache[key];
    if (items) return items;
    items = new ItemGraph();
    items.query(params);
    cache[key] = items;
    return items;
}

/**
 * Handler for the 'cache:items' request.
 */
function cacheByClass(cls: Node | string) {
    const clsId = asURI(cls);
    return ensureCache(`${byClass}-${clsId}`, {
        predicate: rdf.type,
        object: clsId,
    });
}

/**
 * Handler for the 'cache:inverse-related' request.
 */
function cacheInverseRelated(item: Node | string) {
    const itemId = asURI(item);
    return ensureCache(`${inverse}-${itemId}`, {object: itemId});
}

/**
 * Creating the channel bindings.
 */
ldChannel.reply(`cache:${byClass}`, cacheByClass);
ldChannel.reply(`cache:${inverse}`, cacheInverseRelated);
