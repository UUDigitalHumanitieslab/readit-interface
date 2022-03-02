import ldChannel from './common-rdf/radio';
import { item } from './common-rdf/ns';
import { isBlank } from './utilities/linked-data-utilities';

import { startStore, endStore } from './test-util';

describe('global test utilities', function() {
    describe('startStore/endStore', function() {
        beforeEach(startStore);
        afterEach(endStore);

        it('will not hang because of pending requests', function() {
            const result1 = ldChannel.request('obtain', item('nonexisting1'));
            const result2 = ldChannel.request('obtain', item('nonexisting2'));
            expect(isBlank(result1)).toBeFalsy();
            expect(isBlank(result2)).toBeFalsy();
        });
    });
});
