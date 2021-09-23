import ldChannel from '../common-rdf/radio';
import Collection from '../core/collection';
import { parseResponse, getNodeList } from '../utilities/prefetch-utilities';

const sourceList = new Collection();
sourceList.parse = parseResponse;

export default sourceList;

/**
 * Registering our services with the radio channel.
 */
ldChannel.once('cache:source-list', () => getNodeList(sourceList, false));