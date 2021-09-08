import ldChannel from '../common-rdf/radio';
import { sourceOntology as source } from '../common-rdf/ns';
import Graph from '../common-rdf/graph';

const sourceOntology = new Graph();
export default sourceOntology;
let promise: PromiseLike<Graph> = null;

/**
 * The function that takes care of the lazy fetching.
 */
function ensurePromise(): PromiseLike<Graph> {
    if (promise) return promise;
    promise = sourceOntology.fetch({ url: source() }).then(handleSuccess, handleError);
    return promise;
}

/**
 * Promise resolution and rejection handlers.
 * Besides returning the result or error, they short-circuit the
 * promise in order to save a few ticks.
 */
function handleSuccess(): Graph {
    console.log('succcess')
    promise = Promise.resolve(sourceOntology);
    return sourceOntology;
}

function handleError(error: any): any {
    console.log(error)
    promise = Promise.reject(error);
    return error;
}

/**
 * Registering our services with the radio channel.
 */
ldChannel.once('cache:source-ontology', ensurePromise);
ldChannel.reply('source-ontology:promise', ensurePromise);
ldChannel.reply('source-ontology:graph', () => (ensurePromise(), sourceOntology));
