import '../test-util';

import { sortBy } from 'lodash';
import { compact, flatten } from 'jsonld';

import compacted from './mock-compact';
import expanded from './mock-expanded';
import context from './mock-context';

describe('the expanded mock data', function() {
    it('actually correspond to the compact mock data', async function() {
        let actualExpanded = sortBy(await flatten(compacted), '@id');
        let anticipatedExpanded = sortBy(expanded, '@id');
        expect(actualExpanded).toEqual(anticipatedExpanded);
    });

    it('and vice versa', async function() {
        let actualCompacted = sortBy((await compact(expanded, context)), '@id');
        let anticipatedCompacted = sortBy(compacted, '@id');
        expect(actualCompacted).toEqual(anticipatedCompacted);
    });
});
