/**
 * This module provides global access to the ontology. While the
 * ontology is provided as a default export, this is only meant for
 * other global and aspect modules; unit modules should only access
 * the ontology indirectly through the linked data radio channel. The
 * ontology is fetched lazily, i.e., not before it is first requested.
 *
 * This module provides its service through one trigger and two
 * requests:

    ldChannel.trigger('cache:ontology')

 * This will cause the module to fetch the ontology. Useful to
 * trigger caching of the ontology in code that doesn't actually use
 * the ontology.

    ldChannel.request('ontology:promise')

 * Returns a promise that resolves to a Graph containing the fetched
 * ontology. Will cause a request if the ontology hasn't been fetched
 * yet. Useful in async code that must reliably access the fully
 * fetched ontology.

    ldChannel.request('ontology:graph')

 * Returns a Graph that will eventually contain the ontology. Will
 * cause a request if the ontology hasn't been fetched yet. Useful in
 * sync code that can wait until a later event in order to access the
 * ontology Nodes, or in sync code where it is reasonable to assume
 * that the ontology has already been fetched.
 */

import ldChannel from '../core/radio';
import { readit } from '../core/ns';
import Graph from '../core/graph';

const ontology = new Graph();
export default ontology;
let promise: PromiseLike<Graph> = null;

/**
 * The function that takes care of the lazy fetching.
 */
function ensurePromise(): PromiseLike<Graph> {
    if (promise) return promise;
    promise = ontology.fetch({url: readit()}).then(handleSuccess, handleError);
    return promise;
}

/**
 * Promise resolution and rejection handlers.
 * Besides returning the result or error, they short-circuit the
 * promise in order to save a few ticks.
 */
function handleSuccess(): Graph {
    promise = Promise.resolve(ontology);
    return ontology;
}

function handleError(error: any): any {
    promise = Promise.reject(error);
    return error;
}

/**
 * Registering our services with the radio channel.
 */
ldChannel.once('cache:ontology', ensurePromise);
ldChannel.reply('ontology:promise', ensurePromise);
ldChannel.reply('ontology:graph', () => (ensurePromise(), ontology));
