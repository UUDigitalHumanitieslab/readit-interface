import { mapValues, invert, pick, assign, omit, each, delay } from 'lodash';
import { Events } from 'backbone';

import { event, timeout, startStore, endStore } from '../test-util';
import { contentClass, readerClass } from '../mock-data/mock-ontology';
import mockItems from '../mock-data/mock-items';
import { skos, dcterms, oa, readit, item } from '../jsonld/ns';
import { asNative } from '../jsonld/conversion';
import Node from '../jsonld/node';
import FlatItem from './flat-item-model';

interface NodeMap {
    [key: string]: Node;
}

const itemAttributes = mockItems.slice(0, 5);
const itemKeys = 'annotation item target position text'.split(' ');
const itemIndex = invert(itemKeys);

const expectedFlatAttributes = {
    annotation: jasmine.any(Node),
    id: item('100'),
    class: jasmine.any(Node),
    classLabel: 'Content',
    cssClass: 'is-readit-content',
    item: jasmine.any(Node),
    label: 'The Idler in France',
    source: jasmine.any(Node),
    startPosition: 15,
    endPosition: 34,
    text: 'The Idler in France',
    prefix: 'English descriptions of reading experiences <br><br> id_19 Titre : ',
    suffix: ' / by the countess of Blessington Auteur : Blessington,',
    creator: jasmine.any(Node),
    created: jasmine.any(Date),
};

export function createPlaceholder(attributes): Node {
    return new Node(pick(attributes, '@id'));
}

function getPlaceholders(): NodeMap {
    return mapValues(itemIndex, idx => createPlaceholder(itemAttributes[idx]));
}

function getFullItems(): NodeMap {
    return mapValues(itemIndex, idx => new Node(itemAttributes[idx]));
}

// Helper to make a `FlatItem`'s `'complete'` event `await`-able.
// As a special case, this one also works if the event already triggered.
export function completion(anno: FlatItem): Promise<void> {
    return (anno.complete) ? Promise.resolve() : event(anno, 'complete');
}

describe('FlatItem', function() {
    beforeEach(startStore);
    afterEach(endStore);

    it('does not do much until data arrive', async function() {
        const items = getPlaceholders();
        const spy = jasmine.createSpy();
        const flatAnno = new FlatItem(items.annotation);
        flatAnno.once('complete', spy);
        await timeout(50);
        expect(spy).not.toHaveBeenCalled();
        expect(flatAnno.complete).toBe(false);
        expect(flatAnno.attributes).toEqual({ id: items.annotation.id });
    });

    it('flattens data that are there from the start', async function() {
        const items = getFullItems();
        const ontologyClass = new Node(contentClass);
        const spy = jasmine.createSpy();
        const flatAnno = new FlatItem(items.annotation);
        flatAnno.on('complete', spy);
        await completion(flatAnno);
        expect(flatAnno.complete).toBe(true);
        expect(flatAnno.attributes).toEqual(expectedFlatAttributes);
        await timeout(50);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('completes without an item when no item is expected', async function() {
        const items = getFullItems();
        const ontologyClass = new Node(contentClass);
        items.annotation.unset(oa.hasBody, items.item);
        items.item.clear();
        const flatAnno = new FlatItem(items.annotation);
        await completion(flatAnno);
        expect(flatAnno.complete).toBe(true);
        expect(flatAnno.attributes).toEqual(
            omit(expectedFlatAttributes, ['item', 'label'])
        );
    });

    it('flattens data that arrive with a delay', async function() {
        const items = getPlaceholders();
        const ontologyClass = createPlaceholder(contentClass);
        const flatAnno = new FlatItem(items.annotation);
        each(itemAttributes, (attributes, index) => delay(
            () => items[itemKeys[index]].set(attributes),
            (index + 1) * 10
        ));
        await timeout(80);
        expect(flatAnno.complete).toBe(false);
        ontologyClass.set(contentClass);
        await completion(flatAnno);
        expect(flatAnno.complete).toBe(true);
        expect(flatAnno.attributes).toEqual(expectedFlatAttributes);
    });

    it('updates the class and item after the fact', async function() {
        const items = getFullItems();
        const ontologyClass = new Node(contentClass);
        const flatAnno = new FlatItem(items.annotation);
        await completion(flatAnno);

        const replacementItem = new Node({
            '@id': item('1000'),
            '@type': ontologyClass.id,
            [skos.prefLabel]: {'@value': 'The slacker in Bohemia'},
        });
        items.annotation.unset(oa.hasBody, items.item, {silent: true});
        items.annotation.set(oa.hasBody, replacementItem);
        await event(flatAnno, 'change');
        expect(flatAnno.get('label')).toBe('The slacker in Bohemia');
        expect(flatAnno.get('item')).toBe(replacementItem);
        expect(flatAnno.get('cssClass')).toBe(expectedFlatAttributes.cssClass);
        expect(flatAnno.get('class')).toBe(ontologyClass);

        const replacementClass = new Node(readerClass);
        items.annotation.unset(oa.hasBody, ontologyClass, {silent: true});
        items.annotation.set(oa.hasBody, replacementClass);
        await event(flatAnno, 'change');
        expect(flatAnno.get('label')).toBe('The slacker in Bohemia');
        expect(flatAnno.get('item')).toBe(replacementItem);
        expect(flatAnno.get('cssClass')).toBe('is-readit-reader');
        expect(flatAnno.get('class')).toBe(replacementClass);
    });

    it('cannot be tricked into completing multiple times', async function() {
        const items = getFullItems();
        const ontologyClass = new Node(contentClass);
        const flatAnno = new FlatItem(items.annotation);
        await completion(flatAnno);
        const spy = jasmine.createSpy();
        flatAnno.on('complete', spy);
        // unset and reset one flag
        flatAnno._completionFlags ^= 32;
        flatAnno._setCompletionFlag(32);
        // unset and reset all flags
        flatAnno._completionFlags = 0;
        flatAnno._setCompletionFlag(63);
        await timeout(50);
        expect(spy).not.toHaveBeenCalled();
    });

    it('deals with missing optional attributes', async function() {
        const items = getFullItems();
        const ontologyClass = new Node(contentClass);
        items.text.unset(oa.suffix);
        const flatAnno = new FlatItem(items.annotation);
        await completion(flatAnno);
        expect(flatAnno.attributes).toEqual(omit(expectedFlatAttributes, 'suffix'));
    });

    it('can flatten a bare item', async function() {
        const ontologyClass = new Node(contentClass);
        const items = getFullItems();
        const flatItem = new FlatItem(items.item);
        await completion(flatItem);
        expect(flatItem.attributes).toEqual(assign({
            id: items.item.id,
            item: items.item,
            class: ontologyClass,
        }, pick(
            expectedFlatAttributes,
            'classLabel',
            'cssClass',
            'label',
            'creator',
            'created'
        )));
    });

    it('can flatten a bare class', async function() {
        const ontologyClass = new Node(contentClass);
        const flatClass = new FlatItem(ontologyClass);
        await completion(flatClass);
        expect(flatClass.attributes).toEqual(assign({
            id: ontologyClass.id,
            class: ontologyClass,
        }, pick(
            expectedFlatAttributes,
            'classLabel',
            'cssClass',
            'creator',
            'created'
        )));
    });

    it('can flatten a bare target', async function() {
        const items = getFullItems();
        const flatTarget = new FlatItem(items.target);
        await completion(flatTarget);
        expect(flatTarget.attributes).toEqual(assign({
            id: items.target.id,
        }, omit(
            expectedFlatAttributes,
            'id',
            'annotation',
            'item',
            'label',
            'class',
            'classLabel',
            'cssClass'
        )));
    });

    it('can flatten an annotation without a body', async function() {
        const items = getFullItems();
        items.annotation.unset(oa.hasBody);
        const flatAnno = new FlatItem(items.annotation);
        await completion(flatAnno);
        expect(flatAnno.attributes).toEqual(omit(
            expectedFlatAttributes,
            'item',
            'label',
            'class',
            'classLabel',
            'cssClass'
        ));
    });

    it('can flatten a bare selector', async function() {
        const items = getFullItems();
        const flatSelector = new FlatItem(items.position);
        await completion(flatSelector);
        expect(flatSelector.attributes).toEqual(assign({
            id: items.position.id
        }, pick(
            expectedFlatAttributes,
            'startPosition',
            'endPosition',
            'creator',
            'created'
        )));
    });
});