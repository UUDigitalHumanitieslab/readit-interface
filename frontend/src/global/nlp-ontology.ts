/**
 * This module provides its service through one trigger and two
 * requests:

    ldChannel.trigger('cache:nlp-ontology')

 * This will cause the module to fetch the ontology. Useful to
 * trigger caching of the ontology in code that doesn't actually use
 * the ontology.

    ldChannel.request('nlp-ontology:promise')

 * Returns a promise that resolves to a Graph containing the fetched
 * ontology. Will cause a request if the ontology hasn't been fetched
 * yet. Useful in async code that must reliably access the fully
 * fetched ontology.

    ldChannel.request('nlp-ontology:graph')

 * Returns a Graph that will eventually contain the ontology. Will
 * cause a request if the ontology hasn't been fetched yet. Useful in
 * sync code that can wait until a later event in order to access the
 * ontology Nodes, or in sync code where it is reasonable to assume
 * that the ontology has already been fetched.
 */

import ldChannel from '../common-rdf/radio';
import { nlpOntology } from '../common-rdf/ns';
import Graph from '../common-rdf/graph';

const nlpOntology = new Graph();
export default nlpOntology;
let promise: PromiseLike<Graph> = null;

/**
 * The function that takes care of the lazy fetching.
 */
function ensurePromise(): PromiseLike<Graph> {
    if (promise) return promise;
    promise = nlpOntology.fetch({ url: nlpOntology() }).then(handleSuccess, handleError);
    return promise;
}

/**
 * Promise resolution and rejection handlers.
 * Besides returning the result or error, they short-circuit the
 * promise in order to save a few ticks.
 */
function handleSuccess(): Graph {
    promise = Promise.resolve(nlpOntology);
    return nlpOntology;
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
ldChannel.reply('ontology:graph', () => (ensurePromise(), nlpOntology));
