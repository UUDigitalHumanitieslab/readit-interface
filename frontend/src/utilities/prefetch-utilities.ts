import {sparqlRoot} from 'config.json';

import Collection from '../core/collection';

import { listNodesQuery } from "../sparql/compile-query";

/**
 * a utility function to ensure that each getNodeList function uses its own promise
 * @returns getNodeList function, with its own promise object
 */
export function nodeListFactory() {
    let promise: PromiseLike<Collection> = null;
    
    function getNodeList(queriedList: Collection, queryingItems: boolean): PromiseLike<Collection> {
        if (!promise) {
            const query = listNodesQuery(queryingItems, {});
            const endpoint = queryingItems ? 'item/query' : 'source/query'
            promise = queriedList.fetch({ 
                url: sparqlRoot + endpoint, 
                data: $.param({ query: query }), 
                remove: false
            }).then(() => handleSuccess(queriedList), handleError);
        }
    return promise;
    }
    
    function handleSuccess(queriedList): Collection {
        promise = Promise.resolve(queriedList);
        return queriedList;
    }
    
    function handleError(error: any): any {
        promise = Promise.reject(error);
        return error;
    }

    return getNodeList;
}


// export function getNodeList(queriedList: Collection, promise: PromiseLike<Collection>, queryingItems: boolean): PromiseLike<Collection> {
//     if (!promise) {
//         const query = listNodesQuery(queryingItems, {});
//         const endpoint = queryingItems ? 'item/query' : 'source/query'
//         promise = queriedList.fetch({ 
//             url: sparqlRoot + endpoint, 
//             data: $.param({ query: query }), 
//             remove: false
//         }).then(() => handleSuccess(queriedList), handleError);
//     }
//     return promise;
// }

/**
 * Promise resolution and rejection handlers.
 * Besides returning the result or error, they short-circuit the
 * promise in order to save a few ticks.
 */
 

export function parseResponse(response): [] {
    return response.results.bindings.map( node => node.node );
}