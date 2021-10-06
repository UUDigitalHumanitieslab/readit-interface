import ldChannel from '../common-rdf/radio';
import Collection from '../core/collection';
import { nodeListFactory, parseResponse, userNodesFactory } from '../utilities/prefetch-utilities';
import ItemGraph from '../common-adapters/item-graph';


const itemList = new Collection();
itemList.parse = parseResponse;
const getNodeList = nodeListFactory();

const userItems = new ItemGraph();
const getUserNodes = userNodesFactory();


/**
 * Registering our services with the radio channel.
 */
ldChannel.once('cache:item-list', () => getNodeList(itemList, true));
ldChannel.reply('promise:item-list', () => getNodeList(itemList, true));
ldChannel.once('cache:user-items', () => getUserNodes(userItems, true));
ldChannel.reply('promise:user-items', () => getUserNodes(userItems, true));
