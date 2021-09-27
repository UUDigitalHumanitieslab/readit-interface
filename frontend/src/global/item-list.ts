import ldChannel from '../common-rdf/radio';
import Collection from '../core/collection';
import { nodeListFactory, parseResponse } from '../utilities/prefetch-utilities';

const itemList = new Collection();
itemList.parse = parseResponse;
export default itemList;

const getNodeList = nodeListFactory();

/**
 * Registering our services with the radio channel.
 */
ldChannel.once('cache:item-list', () => getNodeList(itemList, true));
ldChannel.reply('item-list:promise', () => getNodeList(itemList, true));