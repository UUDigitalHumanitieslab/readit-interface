import { once } from 'lodash';

import {sparqlRoot} from 'config.json';
import ldChannel from '../common-rdf/radio';
import Collection from '../core/collection';
import { listNodesQuery } from '../sparql/compile-query';

const sourceList = new Collection();
sourceList.parse = parseResponse;

export default sourceList;

function getSourceList(): void {
    const query = listNodesQuery(false, {});
    sourceList.fetch({ 
        url: sparqlRoot + 'source/query', 
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
 ldChannel.once('cache:source-list', getSourceList)