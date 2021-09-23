import { once } from 'lodash';

import {sparqlRoot} from 'config.json';
import ldChannel from '../common-rdf/radio';
import Collection from '../core/collection';
import { listNodesQuery } from '../sparql/compile-query';
import { ensurePromise, parseResponse } from '../utilities/prefetch-utilities';
import { item } from '../explorer/route-actions';

const itemList = new Collection();
itemList.parse = parseResponse;
const query = listNodesQuery(true, {});
export default itemList;



/**
 * Registering our services with the radio channel.
 */
ldChannel.once('cache:item-list', () => ensurePromise(itemList, sparqlRoot + 'item/query', false, $.param({ query: query })));
ldChannel.reply('item-list:promise', () => ensurePromise(itemList, sparqlRoot + 'item/query', false, $.param({ query: query })));
// ldChannel.reply('item-list:graph', () => (ensurePromise(itemList, sparqlRoot + 'item/query', false, $.param({ query: query }), itemList));