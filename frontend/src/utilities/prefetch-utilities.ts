import {sparqlRoot} from 'config.json';
import Collection from '../core/collection';

import { listNodesQuery } from "../sparql/compile-query";

export function getNodeList(nodeList: Collection, queryingItems: boolean): void {
    const query = listNodesQuery(queryingItems, {});
    const endpoint = queryingItems ? 'item/query' : 'source/query'
    nodeList.fetch({ 
        url: sparqlRoot + endpoint, 
        data: $.param({ query: query }), 
        remove: false
    });
}

export function parseResponse(response): [] {
    return response.results.bindings.map( node => node.node );
}