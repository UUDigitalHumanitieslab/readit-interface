import { each } from 'lodash';

import ldChannel from './common-rdf/radio';
import { item, oa } from './common-rdf/ns';
import Node from './common-rdf/node';
import FlatItem from './common-adapters/flat-item-model';
import { isBlank, cssClassCache } from './utilities/linked-data-utilities';
import { placeholderClass } from './utilities/annotation-utilities';

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

        // At the time of writing (please refer to git blame to identify the
        // commit), if running the unittests with random seed 74183, the test
        // "CategoryColorsView > renders a HTML style tag with some CSS in it"
        // (and a few others in the same suite) would fail due to
        // `getCssClassName(placeholderClass)` returning `is-readit-placeholder`
        // instead of `is-readit-selection`. This effect arose from a complex
        // interaction with *two* other tests that needed to precede the
        // CategoryColorsView tests in the following order:
        //
        // 1. "utilities > getCssClassName > *" (any in the suite)
        // 2. "AnnotationEditView > can be constructed without the context of
        //    an ExplorerView"
        //
        // The `afterEach` hook of test 1 would clear the `cssClassCache`,
        // removing the previously correctly established value
        // `is-readit-selection`. Test 2 would then cause the class name to be
        // recomputed, based on an id-only substitute for `placeholderClass`.
        // The substitute was used because `placeholderClass` was retrieved
        // indirectly through the `get` method of another `Node` (an
        // oa:Annotation) and because the original `placeholderClass` was absent
        // from the store. This, in turn, was due to the fixture store being
        // created later than `placeholderClass` itself. With the skos:prefLabel
        // not being present in the substitute, the css class was based on the
        // id instead, producing the wrong value `is-readit-placeholder`. This
        // wrong value was finally stored in `cssClassCache`, causing failure in
        // the CategoryColorsView tests.
        //
        // The following regression test reliably reproduces the above
        // situation, regardless of the presence and order of other tests.
        // `startStore` should not only include `placeholderClass` but also any
        // other `Node`s that are created at module scope ("ambient").
        // Unfortunately, there is no general way to check that this is indeed
        // the case for all ambient `Node`s.
        it('include ambient Nodes', function(done) {
            each(cssClassCache, (_, key) => delete cssClassCache[key]);
            const anno = new Node({
                '@id': 'testAnno',
                '@type': [oa.Annotation],
                [oa.hasBody]: {'@id': placeholderClass.id},
            });
            const flatAnno = new FlatItem(anno);
            flatAnno.when('cssClass', function(_, cssClass) {
                expect(cssClass).toBe('is-readit-selection');
                done();
            });
        });
    });
});
