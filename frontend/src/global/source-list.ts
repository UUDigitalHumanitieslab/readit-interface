import ItemGraph from '../common-adapters/item-graph';
import ldChannel from '../common-rdf/radio';
import Collection from '../core/collection';
import { parseResponse, nodeListFactory, userNodesFactory } from '../utilities/prefetch-utilities';

const sourceList = new Collection();
sourceList.parse = parseResponse;
const getNodeList = nodeListFactory();

const userSources = new ItemGraph();
const getUserNodes = userNodesFactory();

/**
 * Registering our services with the radio channel.
 */
ldChannel.once('cache:source-list', () => getNodeList(sourceList, false));
ldChannel.reply('promise:source-list', () => getNodeList(sourceList, false));
ldChannel.once('cache:user-sources', () => getUserNodes(userSources, false));
ldChannel.reply('promise:user-sources', () => getUserNodes(userSources, false));