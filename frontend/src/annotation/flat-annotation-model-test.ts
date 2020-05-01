import { mapValues, invert, pick, assign, omit, each, delay } from 'lodash';
import { Events } from 'backbone';

import { event, timeout, startStore, endStore } from '../test-util';
import { contentClass, readerClass } from '../mock-data/mock-ontology';
import mockItems from '../mock-data/mock-items';
import { skos, dcterms, oa, readit, item } from '../jsonld/ns';
import { asNative } from '../jsonld/conversion';
import Node from '../jsonld/node';
import FlatAnnotation from './flat-annotation-model';

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

// Helper to make a `FlatAnnotation`'s `'complete'` event `await`-able.
// As a special case, this one also works if the event already triggered.
export function completion(anno: FlatAnnotation): Promise<void> {
    return (anno.complete) ? Promise.resolve() : event(anno, 'complete');
}

describe('FlatAnnotationModel', function() {
    beforeEach(startStore);
    afterEach(endStore);

    it('does not do much until data arrive', async function() {
        const items = getPlaceholders();
        const spy = jasmine.createSpy();
        const flatAnno = new FlatAnnotation(items.annotation);
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
        const flatAnno = new FlatAnnotation(items.annotation);
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
        const flatAnno = new FlatAnnotation(items.annotation);
        await completion(flatAnno);
        expect(flatAnno.complete).toBe(true);
        expect(flatAnno.attributes).toEqual(
            omit(expectedFlatAttributes, ['item', 'label'])
        );
    });

    it('flattens data that arrive with a delay', async function() {
        const items = getPlaceholders();
        const ontologyClass = createPlaceholder(contentClass);
        const flatAnno = new FlatAnnotation(items.annotation);
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
        const flatAnno = new FlatAnnotation(items.annotation);
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
        const flatAnno = new FlatAnnotation(items.annotation);
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
});
