import { once } from 'lodash';

import { source } from '../core/ns';
import Graph from '../core/graph';

const sources = new Graph();
export default sources;

function getSources(): void {
    sources.fetch({ url: source() });
}

export const ensureSources = once(getSources);
