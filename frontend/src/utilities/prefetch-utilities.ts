import Graph from "../common-rdf/graph";

let promise: PromiseLike<Graph> = null;

/**
 * The function that takes care of the lazy fetching of a graph
 */
export function ensurePromise(graph, url, prefetch=true, data?): PromiseLike<Graph> {
    if (promise) return promise;
    const fetchObject = { url: url, prefetch: prefetch };
    if (data) {fetchObject['data'] = data};
    promise = graph.fetch(fetchObject).then(handleSuccess, handleError);
    return promise;
}

/**
 * Promise resolution and rejection handlers.
 * Besides returning the result or error, they short-circuit the
 * promise in order to save a few ticks.
 */
function handleSuccess(graph): Graph {
    promise = Promise.resolve(graph);
    return graph;
}

function handleError(error: any): any {
    promise = Promise.reject(error);
    return error;
}

export function parseResponse(response): [] {
    return response.results.bindings.map( node => node.node );
}