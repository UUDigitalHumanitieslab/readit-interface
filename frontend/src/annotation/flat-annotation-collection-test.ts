import { map } from 'lodash';

import { event, timeout, startStore, endStore } from '../test-util';
import { oa, item } from '../jsonld/ns';
import Graph from '../jsonld/graph';
import ontologyData from '../mock-data/mock-ontology';
import itemData from '../mock-data/mock-items';
import { createPlaceholder, completion } from './flat-annotation-model-test';
import FlatModel from './flat-annotation-model';
import FlatCollection from './flat-annotation-collection';

const numAnnotations = 5;
const firstAnnoId = item('100');

// Helper to make `times` `'complete'` events `await`-able on `annos`.
// Be sure to invoke this function before, and `await` its result after, running
// the code that is supposed to trigger the events.
function completions(annos: FlatCollection, times: number): Promise<void> {
    return new Promise(resolve => {
        let count = 0;
        const handler = () => {
            if (++count == times) {
                annos.off('complete', handler);
                resolve();
            }
        };
        annos.on('complete', handler);
    });
}

describe('FlatAnnotationCollection', function() {
    beforeEach(startStore);

    beforeEach(function() {
        this.ontology = new Graph(ontologyData.map(createPlaceholder));
        this.items = new Graph(itemData.map(createPlaceholder));
        this.flat = new FlatCollection(this.items);
        this.completionTrigger
    });

    afterEach(endStore);

    it('remains empty until a Node is a confirmed annotation', async function(){
        expect(this.flat.length).toBe(0);
        await timeout(50);
        expect(this.flat.length).toBe(0);
    });

    it('adds flat annotations when types are known', async function() {
        const spy = jasmine.createSpy();
        this.flat.on('add complete', spy);
        this.items.set(itemData);
        expect(this.flat.length).toBe(numAnnotations);
        await timeout(50);
        // We don't expect `'add'` events in this case, because these
        // annotations were passed to the collection during initialization.
        // Also, we don't expect `'complete'` because the ontology data are
        // still missing.
        expect(spy).not.toHaveBeenCalled();
    });

    it('propagates "complete" events', async function() {
        const spy = jasmine.createSpy();
        this.flat.on('complete', spy);
        this.ontology.set(ontologyData);
        this.items.set(itemData);
        const length = this.flat.length;
        expect(length).toBe(numAnnotations);
        expect(spy).not.toHaveBeenCalled();
        for (let i = 0; i < length; ++i) {
            const anno = this.flat.at(i);
            await completion(anno);
            expect(spy).toHaveBeenCalledWith(anno, anno.get('annotation'));
        }
        expect(spy).toHaveBeenCalledTimes(length);
    });

    it('triggers a "complete:all" event', async function() {
        const completion = event(this.flat, 'complete:all');
        this.ontology.set(ontologyData);
        this.items.set(itemData);
        await completion;
        this.flat.each(anno => expect(anno.complete).toBe(true));
    });

    it('adds annotations immediately if possible', async function() {
        this.items.set(itemData);
        const newFlat = new FlatCollection(this.items);
        expect(newFlat.length).toBe(numAnnotations);
    });

    it('works with partial updates', async function() {
        // Complete the ontology, all data of the first two annotations, and the
        // data of the third annotation up to the target.
        this.ontology.set(ontologyData);
        const next2completions = completions(this.flat, 2);
        this.items.set(itemData.slice(0, 18), {remove: false});
        await next2completions;
        expect(this.flat.length).toBe(3);
        // Complete the rest of the annotation data.
        const remainingCompletions = completions(this.flat, numAnnotations - 2);
        this.items.set(itemData.slice(18), {remove: false});
        expect(this.flat.length).toBe(numAnnotations);
        await remainingCompletions;
        this.flat.each(anno => expect(anno.complete).toBe(true));
    });

    it('does not allow removed annotations to sneak back in', async function() {
        const firstItemData = itemData[0];
        const firstItem = this.items.remove(firstItemData);
        expect(firstItem.id).toBe(firstAnnoId);
        firstItem.set(firstItemData);
        expect(firstItem.get('@type')[0]).toBe(oa.Annotation);
        await timeout(50);
        expect(this.flat.length).toBe(0);
    });

    it('stays in sync with the underlying Graph', async function() {
        const completion = completions(this.flat, 5);
        const spy = jasmine.createSpy();
        this.flat.on('complete:all', spy);
        this.ontology.set(ontologyData);
        this.items.set(itemData);
        const removal = event(this.flat, 'remove');
        const addition = event(this.flat, 'add');
        await completion;
        const victim = this.items.remove(firstAnnoId);
        expect(victim.get('@type')[0]).toBe(oa.Annotation);
        await removal;
        expect(this.flat.length).toBe(numAnnotations - 1);
        this.items.add(victim);
        await addition;
        expect(this.flat.length).toBe(numAnnotations);
        await event(this.flat, 'complete');
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it('keeps the annotations sorted by position', async function() {
        const completion = event(this.flat, 'complete:all');
        this.ontology.set(ontologyData);
        this.items.set(itemData);
        await completion;
        await event(this.flat, 'sort');
        expect(this.flat.map('id')).toEqual(
            // This ordering takes only the character position into account, as
            // does FlatAnnotationModel. This is by design and as agreed, i.e.,
            // we agreed with the users to support only plaintext.
            map('103 100 101 102 104'.split(' '), item)
        );
    });
});
