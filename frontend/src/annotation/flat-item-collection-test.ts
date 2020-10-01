import { map } from 'lodash';

import { event, startStore, endStore } from '../test-util';
import { oa, item } from '../jsonld/ns';
import Graph from '../jsonld/graph';
import ontologyData from '../mock-data/mock-ontology';
import itemData from '../mock-data/mock-items';
import { createPlaceholder, completion } from './flat-item-model-test';
import FlatCollection from './flat-item-collection';

const numItems = itemData.length;
export const firstAnnoId = item('100');

// Helper to make `times` `'complete'` events `await`-able on `annos`.
// Be sure to invoke this function before, and `await` its result after, running
// the code that is supposed to trigger the events.
export
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

describe('FlatItemCollection', function() {
    beforeEach(startStore);

    beforeEach(function() {
        this.ontology = new Graph(ontologyData.map(createPlaceholder));
        this.items = new Graph(itemData.map(createPlaceholder));
        this.flat = new FlatCollection(this.items);
    });

    afterEach(endStore);

    it('propagates "complete" events', async function() {
        const spy = jasmine.createSpy();
        this.flat.on('complete', spy);
        this.ontology.set(ontologyData);
        this.items.set(itemData);
        const length = this.flat.length;
        expect(length).toBe(this.items.length);
        for (let i = 0; i < length; ++i) {
            const item = this.flat.at(i);
            await completion(item);
            expect(spy).toHaveBeenCalledWith(item, item.underlying);
        }
        // once for each oa:Annotation, once for each associated item and once
        // for each associated target, because items and targets are included in
        // the same underlying graph while classes aren't.
        expect(spy).toHaveBeenCalledTimes(numItems);
    });

    it('triggers a "complete:all" event', async function() {
        const completion = event(this.flat, 'complete:all');
        this.ontology.set(ontologyData);
        this.items.set(itemData);
        await completion;
        this.flat.each(item => expect(item.complete).toBe(true));
    });

    it('works with partial updates', async function() {
        // Complete the ontology, all data of the first two annotations, and the
        // data of the third annotation up to the target.
        this.ontology.set(ontologyData);
        const next2completions = completions(this.flat, 2);
        this.items.set(itemData.slice(0, 13), {remove: false});
        await next2completions;
        // Complete the rest of the annotation data.
        const fullCompletion = event(this.flat, 'complete:all');
        this.items.set(itemData.slice(13), {remove: false});
        await fullCompletion;
        expect(this.flat.length).toBe(numItems);
        this.flat.each(anno => expect(anno.complete).toBe(true));
    });

    it('stays in sync with the underlying Graph', async function() {
        const completion = completions(this.flat, numItems);
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
        expect(this.flat.length).toBe(numItems - 1);
        this.items.add(victim);
        await addition;
        expect(this.flat.length).toBe(numItems);
        await event(this.flat, 'complete');
        // We expect no full completion because this.items includes
        // uncompleteable nodes.
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it('keeps track of which annotation has focus', async function() {
        const completion = event(this.flat, 'complete:all');
        this.ontology.set(ontologyData);
        this.items.set(itemData);
        await completion;
        const [first, second] = [this.flat.at(0), this.flat.at(1)];
        const blurSpy = jasmine.createSpy('blurSpy');
        this.flat.on('blur', blurSpy);
        // We start without focus.
        expect(this.flat.focus).toBeUndefined();
        // Focus shifts to the first annotation.
        first.trigger('focus', first);
        expect(blurSpy).not.toHaveBeenCalled();
        expect(this.flat.focus).toBe(first);
        // Shift focus to the second.
        second.trigger('focus', second);
        expect(blurSpy).toHaveBeenCalledWith(first, second);
        expect(this.flat.focus).toBe(second);
        // Focusing an annotation that is already in focus has no effect.
        second.trigger('focus', second);
        expect(blurSpy).toHaveBeenCalledTimes(1);
        expect(this.flat.focus).toBe(second);
        // Blurring an annotation that is already out of focus has no effect.
        first.trigger('blur', first);
        expect(blurSpy).toHaveBeenCalledTimes(2);
        expect(blurSpy).not.toHaveBeenCalledWith(second, first);
        expect(this.flat.focus).toBe(second);
        // Focus can shift back and forth.
        first.trigger('focus', first);
        expect(blurSpy).toHaveBeenCalledWith(second, first);
        expect(this.flat.focus).toBe(first);
        // Focus can be removed altogether.
        first.trigger('blur', first);
        expect(blurSpy).toHaveBeenCalledTimes(4);
        expect(this.flat.focus).toBeUndefined();
    });

    it('respects the order of the underlying collection', function() {
        const getId = model => model.id;
        const subset = itemData.slice(0, 10);
        const initialOrder = map(subset, '@id');
        this.items.set(subset);
        expect(this.items.map(getId)).withContext(
            'items should have same order as raw data'
        ).toEqual(initialOrder);
        expect(this.flat.map(getId)).withContext(
            'flat items should have same order as raw data'
        ).toEqual(initialOrder);
        const extracted = this.items.pop();
        this.items.add(extracted, {at: 3});
        const newOrder = this.items.map(getId);
        expect(newOrder).withContext(
            'modified order is different from raw order'
        ).not.toEqual(initialOrder);
        expect(this.flat.map(getId)).withContext(
            'flat collection adopts modified order'
        ).toEqual(newOrder);
        this.items.comparator = getId;
        this.items.sort();
        const newerOrder = this.items.map(getId);
        expect(newerOrder).withContext(
            'sorted order is different from modified order'
        ).not.toEqual(newOrder);
        expect(this.flat.map(getId)).withContext(
            'flat collection adopts sorted order'
        ).toEqual(newerOrder);
    });
});
