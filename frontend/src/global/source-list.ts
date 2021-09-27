import ldChannel from '../common-rdf/radio';
import Collection from '../core/collection';
import { parseResponse, nodeListFactory } from '../utilities/prefetch-utilities';

const sourceList = new Collection();
sourceList.parse = parseResponse;

export default sourceList;
const getNodeList = nodeListFactory();

/**
 * Registering our services with the radio channel.
 */
ldChannel.once('cache:source-list', () => getNodeList(sourceList, false));
ldChannel.reply('source-list:promise', () => getNodeList(sourceList, false));