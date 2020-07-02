import { once } from 'lodash';

import { source } from '../jsonld/ns';
import Graph from '../jsonld/graph';

const sources = new Graph();
export default sources;

function getSources(): void {
    sources.fetch({ url: source() });
}

export const ensureSources = once(getSources);
