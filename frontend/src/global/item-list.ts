import { once } from 'lodash';

import {sparqlRoot} from 'config.json';
import ldChannel from '../common-rdf/radio';
import Collection from '../core/collection';
import { listNodesQuery } from '../sparql/compile-query';

const itemList = new Collection();
itemList.parse = parseResponse;
export default itemList;

function getItemList(): void {
    const query = listNodesQuery(true, {});
    itemList.fetch({ 
        url: sparqlRoot + 'item/query', 
        data: $.param({ query: query }), 
        remove: false
    });
}


function parseResponse(response): [] {
    return response.results.bindings.map( node => node.node );
}

/**
 * Registering our services with the radio channel.
 */
 ldChannel.once('cache:item-list', getItemList)