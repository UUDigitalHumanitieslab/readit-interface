import { once } from 'lodash';

import {sparqlRoot} from 'config.json';
import ldChannel from '../common-rdf/radio';
import Collection from '../core/collection';
import { listNodesQuery } from '../sparql/compile-query';
import { ensurePromise, parseResponse } from '../utilities/prefetch-utilities';

const sourceList = new Collection();
sourceList.parse = parseResponse;

export default sourceList;

// function getSourceList(): void {
//     const query = listNodesQuery(false, {});
//     sourceList.fetch({ 
//         url: sparqlRoot + 'source/query', 
//         data: $.param({ query: query }), 
//         remove: false
//     });
// }

/**
 * Registering our services with the radio channel.
 */
ldChannel.once('cache:source-list', () => ensurePromise(sourceList, sparqlRoot + 'item/query', false, $.param({ query: query })));
ldChannel.reply('source-list:promise', () => ensurePromise(sourceList, sparqlRoot + 'item/query', false, $.param({ query: query })));