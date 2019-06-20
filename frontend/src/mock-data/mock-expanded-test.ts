import '../test-util';

import { sortBy } from 'lodash';
import { flatten } from 'jsonld';

import compact from './mock-compact';
import expanded from './mock-expanded';

describe('the expanded mock data', function() {
    it('actually correspond to the compact mock data', async function() {
        let actualExpanded = sortBy(await flatten(compact), '@id');
        let anticipatedExpanded = sortBy(expanded, '@id');
        expect(actualExpanded).toEqual(anticipatedExpanded);
    });
});
