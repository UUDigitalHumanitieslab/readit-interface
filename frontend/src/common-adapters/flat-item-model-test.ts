import {
    mapValues, invert, pick, assign, omit, each, delay,
    map, partition, keys, random, constant,
} from 'lodash';
import { Events } from 'backbone';

import { event, timeout, startStore, endStore } from '../test-util';
import {
    contentClass,
    readerClass,
    descriptionOfProperty,
} from '../mock-data/mock-ontology';
import mockNLP from '../mock-data/mock-nlp-ontology';
import mockItems from '../mock-data/mock-items';

import { skos, dcterms, oa, readit, nlp, item } from '../common-rdf/ns';
import userChannel from '../common-user/user-radio';
import { asNative } from '../common-rdf/conversion';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';
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
    target: jasmine.any(Node),
    source: jasmine.any(Node),
    positionSelector: jasmine.any(Node),
    startPosition: 15,
    endPosition: 34,
    quoteSelector: jasmine.any(Node),
    text: 'The Idler in France',
    prefix: 'English descriptions of reading experiences <br><br> id_19 Titre : ',
    suffix: ' / by the countess of Blessington Auteur : Blessington,',
    creator: jasmine.any(Node),
    created: jasmine.any(Date),
    isOwn: false,
};

const expectedFilterClasses = [
    expectedFlatAttributes.cssClass,
    'rit-is-semantic',
    'rit-verified',
    'rit-other-made',
];

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

    describe('getFilterClasses', function() {
        it('produces an array of filterable CSS classes', async function() {
            const items = getFullItems();
            const ontologyClass = new Node(contentClass);
            const flatAnno = new FlatItem(items.annotation);
            await completion(flatAnno);
            expect(flatAnno.getFilterClasses()).toEqual(expectedFilterClasses);
        });
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
        expect(flatAnno.getFilterClasses()).toEqual(expectedFilterClasses);
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
        ontologyClass.set(contentClass);
        await completion(flatAnno);
        expect(flatAnno.complete).toBe(true);
        expect(flatAnno.attributes).toEqual(expectedFlatAttributes);
        expect(flatAnno.getFilterClasses()).toEqual(expectedFilterClasses);
    });

    describe('completes even in the face of fragmented resources', function() {
        const resourceAttributes = itemAttributes.concat(contentClass);
        const coinflip = () => random(1);
        const partitionKeys = attr => partition(keys(attr), coinflip);

        // This is a fuzz test. Ten repetitions with random sampling.
        for (let i = 0; i < 10; ++i) {
            it(`fuzz ${i}`, async function() {
                // For each item/class, we partition the keys randomly.
                const chunks = map(resourceAttributes, partitionKeys);
                // Next, we create two partial representations of the resources.
                // Together, they contain all properties.
                const [firstBatch, secondBatch] = map([0, 1], (order) => {
                    return map(resourceAttributes, (attr, index) => {
                        // We include `@id` in both sets so that Backbone is
                        // able to merge them again.
                        return pick(attr, chunks[index][order], '@id');
                    });
                });
                const graph = new Graph(firstBatch);
                const flatAnno = new FlatItem(graph.at(0));
                await timeout(10);
                graph.set(secondBatch as unknown as Node[]);
                await completion(flatAnno);
                expect(flatAnno.attributes).toEqual(expectedFlatAttributes);
                expect(flatAnno.getFilterClasses())
                    .toEqual(expectedFilterClasses);
            });
        }
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
        items.annotation.unset(oa.hasBody, items.item);
        expect(flatAnno.has('item')).toBeFalsy();
        const itemEvent = event(flatAnno, 'change:label');
        items.annotation.set(oa.hasBody, replacementItem);
        await itemEvent;
        expect(flatAnno.get('label')).toBe('The slacker in Bohemia');
        expect(flatAnno.get('item')).toBe(replacementItem);
        expect(flatAnno.get('cssClass')).toBe(expectedFlatAttributes.cssClass);
        expect(flatAnno.get('class')).toBe(ontologyClass);
        expect(flatAnno.complete).toBe(true);
        expect(flatAnno.getFilterClasses()).toEqual(expectedFilterClasses);

        const replacementClass = new Node(readerClass);
        items.annotation.unset(oa.hasBody, ontologyClass);
        expect(flatAnno.has('class')).toBeFalsy();
        const classEvent = event(flatAnno, 'change:cssClass');
        items.annotation.set(oa.hasBody, replacementClass);
        await classEvent;
        expect(flatAnno.get('label')).toBe('The slacker in Bohemia');
        expect(flatAnno.get('item')).toBe(replacementItem);
        expect(flatAnno.get('cssClass')).toBe('is-readit-reader');
        expect(flatAnno.get('class')).toBe(replacementClass);
        expect(flatAnno.complete).toBe(true);
        const filterClasses = flatAnno.getFilterClasses();
        expect(filterClasses).not.toContain(expectedFlatAttributes.cssClass);
        expect(filterClasses).toContain('is-readit-reader');
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
        const backup = flatAnno._completionFlags;
        flatAnno._completionFlags = 0;
        flatAnno._setCompletionFlag(backup);
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
        expect(flatAnno.getFilterClasses()).toEqual(expectedFilterClasses);
    });

    it('recognizes items created by the current user', async function() {
        const items = getFullItems();
        const ontologyClass = new Node(contentClass);
        const userURI = (items.annotation.get(dcterms.creator)[0] as Node).id;
        userChannel.reply('current-user-uri', constant(userURI));
        const flatAnno = new FlatItem(items.annotation);
        await completion(flatAnno);
        expect(flatAnno.get('isOwn')).toBe(true);
        const filterClasses = flatAnno.getFilterClasses();
        expect(filterClasses).not.toContain('rit-other-made');
        expect(filterClasses).toContain('rit-self-made');
        userChannel.stopReplying('current-user-uri');
    });

    it('tracks the related class', async function() {
        const items = getFullItems();
        const ontologyClass = new Node(contentClass);
        const relatedClass = new Node(readerClass);
        ontologyClass.set(skos.related, relatedClass);
        const flatAnno = new FlatItem(items.annotation);
        await completion(flatAnno);
        expect(flatAnno.get('relatedClass')).toBe(relatedClass);
        const filterClasses = flatAnno.getFilterClasses();
        expect(filterClasses).toContain(expectedFlatAttributes.cssClass);
        expect(filterClasses).toContain('is-readit-reader');
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
            'created',
            'isOwn',
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
            'created',
            'isOwn',
        )));
    });

    it('can flatten a bare NLP class', async function() {
        const ontology = new Graph(mockNLP);
        const ontologyClass = ontology.get(nlp('time'));
        const flatClass = new FlatItem(ontologyClass);
        await completion(flatClass);
        expect(flatClass.attributes).toEqual({
            id: ontologyClass.id,
            class: ontologyClass,
            classLabel: 'time',
            cssClass: 'is-nlp-time',
        });
    });

    it('can flatten a bare property', async function() {
        const ontologyProp = new Node(descriptionOfProperty);
        const flatProp = new FlatItem(ontologyProp);
        await completion(flatProp);
        expect(flatProp.attributes).toEqual({
            id: ontologyProp.id,
            class: ontologyProp,
            classLabel: 'description of',
            cssClass: 'is-readit-descriptionof',
            creator: expectedFlatAttributes.creator,
            created: expectedFlatAttributes.created,
            isOwn: false,
        });
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

    it('can flatten an annotation with an NLP class', async function() {
        const items = getFullItems();
        const ontology = new Graph(mockNLP);
        const timeClass = ontology.get(nlp('time'));
        items.annotation.unset(oa.hasBody).set(oa.hasBody, timeClass);
        const flatAnno = new FlatItem(items.annotation);
        await completion(flatAnno);
        expect(flatAnno.attributes).toEqual(assign({
            class: timeClass,
            classLabel: 'time',
            cssClass: 'is-nlp-time',
        }, omit(
            expectedFlatAttributes,
            'item',
            'label',
            'class',
            'classLabel',
            'cssClass'
        )));
    });

    it('can flatten a bare selector', async function() {
        const items = getFullItems();
        const flatSelector = new FlatItem(items.position);
        await completion(flatSelector);
        expect(flatSelector.attributes).toEqual(assign({
            id: items.position.id
        }, pick(
            expectedFlatAttributes,
            'positionSelector',
            'startPosition',
            'endPosition',
            'creator',
            'created',
            'isOwn',
        )));
    });
});
