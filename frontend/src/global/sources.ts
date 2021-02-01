import { once } from 'lodash';

import { source } from '../common-rdf/ns';
import Graph from '../common-rdf/graph';

const sources = new Graph();
export default sources;

function getSources(): void {
    sources.fetch({ url: source() });
}

export const ensureSources = once(getSources);
