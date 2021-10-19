import {sparqlRoot} from 'config.json';
import ItemGraph from '../common-adapters/item-graph';

import Collection from '../core/collection';

import { listNodesQuery, nodesByUserQuery } from "../sparql/compile-query";

/**
 * a utility function to ensure that each getUserNodes function uses its own promise
 * @returns getUserNodes function, with its own promise object
 */
export function userNodesFactory() {
    let promise: PromiseLike<ItemGraph> = null;
    
    function getUserNodes(userNodes: ItemGraph, queryingItems: boolean): PromiseLike<ItemGraph> {
        if (!promise) {
            const query = nodesByUserQuery(queryingItems);
            promise = userNodes.sparqlQuery(query).then(
                () => handleSuccess(userNodes), handleError
            );
        }
        return promise;
    }
    
    function handleSuccess(userNodes): ItemGraph {
        promise = Promise.resolve(userNodes);
        return userNodes;
    }
    
    function handleError(error: any): any {
        promise = Promise.reject(error);
        return error;
    }

    return getUserNodes;
}

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


export function parseResponse(response): [] {
    return response.results.bindings.map( node => node.node );
}
