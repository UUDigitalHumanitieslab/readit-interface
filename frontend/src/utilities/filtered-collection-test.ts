import { Model } from 'backbone';

import Collection from '../core/collection';
import FilteredCollection from './filtered-collection';

const testAddition = {
    id: 6,
    x: 10,
    a: 1,
};

const testRemoval = {
    id: 3,
    y: 3,
    z: 8,
};

const testUpdate = {
    id: 1,
    x: 2,
    y: 5,
    b: 9,
};

const exampleData = [{
    id: 1,
    x: 10,
    y: 5,
}, {
    id: 2,
    x: 10,
    z: 8,
}, testRemoval, {
    id: 4,
    x: 2,
    y: 3,
    z: 4,
}, {
    id: 5,
    a: 1,
    b: 9,
}];

describe('FilteredCollection', function() {
    let raw, filtered;

    beforeEach(function() {
        raw = new Collection(exampleData);
        expect(raw.length).toBe(5);
    });

    it('keeps only matching models from the underlying collection', function() {
        filtered = new FilteredCollection(raw, m => m.has('x'));
        expect(filtered.length).toBe(3);
    });

    it('triggers "add" for matching models', function() {
        let counter = 0;
        filtered = new FilteredCollection(raw, m => m.has('x'));
        filtered.on('add', () => ++counter);
        raw.add(testAddition);
        expect(counter).toBe(1);
        expect(filtered.length).toBe(4);
    });

    it('does not trigger "add" for nonmatching models', function() {
        let counter = 0;
        filtered = new FilteredCollection(raw, m => m.has('y'));
        filtered.on('add', () => ++counter);
        raw.add(testAddition);
        expect(counter).toBe(0);
        expect(filtered.length).toBe(3);
    });

    it('triggers "remove" for matching models', function() {
        let counter = 0;
        filtered = new FilteredCollection(raw, m => m.has('y'));
        filtered.on('remove', () => ++counter);
        raw.remove(testRemoval);
        expect(counter).toBe(1);
        expect(filtered.length).toBe(2);
    });

    it('does not trigger "remove" for nonmatching models', function() {
        let counter = 0;
        filtered = new FilteredCollection(raw, m => m.has('x'));
        filtered.on('remove', () => ++counter);
        raw.remove(testRemoval);
        expect(counter).toBe(0);
        expect(filtered.length).toBe(3);
    });

    it('triggers "change" for matching models', function() {
        let counter = 0;
        filtered = new FilteredCollection(raw, m => m.has('x'));
        filtered.on('change', () => ++counter);
        raw.set(testUpdate, {merge: true, remove: false});
        expect(counter).toBe(1);
    });

    it('does not trigger "change" for nonmatching models', function() {
        let counter = 0;
        filtered = new FilteredCollection(raw, m => m.has('z'));
        filtered.on('change', () => ++counter);
        raw.set(testUpdate, {merge: true, remove: false});
        expect(counter).toBe(0);
    });

    it('triggers "change:[attr]" for matching models', function() {
        let counter = 0;
        filtered = new FilteredCollection(raw, m => m.has('x'));
        filtered.on('change:x', () => ++counter);
        raw.set(testUpdate, {merge: true, remove: false});
        expect(counter).toBe(1);
    });

    it('does not trigger "change:[attr]" for nonmatching models', function() {
        let counter = 0;
        filtered = new FilteredCollection(raw, m => m.has('z'));
        filtered.on('change:x', () => ++counter);
        raw.set(testUpdate, {merge: true, remove: false});
        expect(counter).toBe(0);
    });

    it('triggers "update" for matching models', function() {
        let counter = 0;
        filtered = new FilteredCollection(raw, m => m.has('x'));
        filtered.on('update', () => ++counter);
        raw.add(testAddition);
        expect(counter).toBe(1);
    });

    it('does not trigger "update" for nonmatching models', function() {
        let counter = 0;
        filtered = new FilteredCollection(raw, m => m.has('y'));
        filtered.on('update', () => ++counter);
        raw.add(testAddition);
        expect(counter).toBe(0);
    });

    it('adopts models when they become matching', function() {
        let counter = 0;
        filtered = new FilteredCollection(raw, m => m.has('b'));
        filtered.on('add', () => ++counter);
        raw.set(testUpdate, {merge: true, remove: false});
        expect(counter).toBe(1);
        expect(filtered.length).toBe(2);
    });

    it('purges models when they become nonmatching', function() {
        let counter = 0;
        filtered = new FilteredCollection(raw, m => m.get('x') === 10);
        filtered.on('remove', () => ++counter);
        raw.set(testUpdate, {merge: true, remove: false});
        expect(counter).toBe(1);
        expect(filtered.length).toBe(1);
    });

    it('resets together with the underlying collection', function() {
        let counter = 0;
        filtered = new FilteredCollection(raw, m => m.has('y'));
        filtered.on('reset', () => ++counter);
        raw.reset();
        expect(counter).toBe(1);
        expect(filtered.length).toBe(0);
    });

    it('works with the attribute name iteratee shorthand', function() {
        let counter = 0;
        const count = () => ++counter;
        filtered = new FilteredCollection(raw, 'x');
        filtered.on('add', count);
        filtered.on('update', count);
        filtered.on('remove', count);
        raw.add(testAddition);
        expect(counter).toBe(2);
        expect(filtered.length).toBe(4);
        raw.remove(exampleData[0]);
        expect(counter).toBe(4);
        expect(filtered.length).toBe(3);
    });

    it('works with the object matcher iteratee shorthand', function() {
        let counter = 0;
        const count = () => ++counter;
        filtered = new FilteredCollection(raw, {x: 10});
        filtered.on('add', count);
        filtered.on('update', count);
        filtered.on('remove', count);
        raw.add(testAddition);
        expect(counter).toBe(2);
        expect(filtered.length).toBe(3);
        raw.set(testUpdate, {merge: true, remove: false});
        expect(counter).toBe(4);
        expect(filtered.length).toBe(2);
    });

    it('adopts the .model from the underlying collection', function() {
        const raw = new Collection([], { model: Model });
        filtered = new FilteredCollection(raw, 'x');
        expect(filtered.model).toBe(raw.model);
    });
});
