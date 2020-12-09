import { map, each } from 'lodash';

import { startStore, endStore, event } from '../test-util';
import mockOntology from '../mock-data/mock-ontology';
import mockItems from '../mock-data/mock-items';

import { item } from '../common-rdf/ns';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';
import FlatCollection from '../common-adapters/flat-annotation-collection';
import Segment from './text-segment-model';
import SegmentCollection from './text-segment-collection';

const edges = [0, 15, 16, 34, 77, 98, 107, 355, 391, Infinity];

const challenging = [
    {startPosition: 39, endPosition: 98, id: "http://localhost:8000/item/14"},
    {startPosition: 100, endPosition: 101, id: "http://localhost:8000/item/86"},
    {startPosition: 100, endPosition: 404, id: "http://localhost:8000/item/68"},
    {startPosition: 102, endPosition: 110, id: "http://localhost:8000/item/27"},
    {startPosition: 111, endPosition: 118, id: "http://localhost:8000/item/62"},
    {startPosition: 129, endPosition: 176, id: "http://localhost:8000/item/21"},
    {startPosition: 406, endPosition: 407, id: "http://localhost:8000/item/80"},
    {startPosition: 406, endPosition: 437, id: "http://localhost:8000/item/41"},
    {startPosition: 406, endPosition: 917, id: "http://localhost:8000/item/74"},
    {startPosition: 441, endPosition: 477, id: "http://localhost:8000/item/55"},
    {startPosition: 622, endPosition: 698, id: "http://localhost:8000/item/48"},
    {startPosition: 868, endPosition: 883, id: "http://localhost:8000/item/93"},
    {startPosition: 890, endPosition: 894, id: "http://localhost:8000/item/99"},
    {startPosition: 895, endPosition: 899, id: "http://localhost:8000/item/105"},
];

const insertionOrder = [
    'http://localhost:8000/item/105', 'http://localhost:8000/item/68',
    'http://localhost:8000/item/74', 'http://localhost:8000/item/99',
    'http://localhost:8000/item/62', 'http://localhost:8000/item/55',
    'http://localhost:8000/item/48', 'http://localhost:8000/item/21',
    'http://localhost:8000/item/27', 'http://localhost:8000/item/41',
    'http://localhost:8000/item/14', 'http://localhost:8000/item/80',
    'http://localhost:8000/item/86', 'http://localhost:8000/item/93',
];

const expectedSegments = [
    {startPosition: 0, endPosition: 39, length: 0},
    {startPosition: 39, endPosition: 98, length: 1},
    {startPosition: 98, endPosition: 100, length: 0},
    {startPosition: 100, endPosition: 101, length: 2},
    {startPosition: 101, endPosition: 102, length: 1},
    {startPosition: 102, endPosition: 110, length: 2},
    {startPosition: 110, endPosition: 111, length: 1},
    {startPosition: 111, endPosition: 118, length: 2},
    {startPosition: 118, endPosition: 129, length: 1},
    {startPosition: 129, endPosition: 176, length: 2},
    {startPosition: 176, endPosition: 404, length: 1},
    {startPosition: 404, endPosition: 406, length: 0},
    {startPosition: 406, endPosition: 407, length: 3},
    {startPosition: 407, endPosition: 437, length: 2},
    {startPosition: 437, endPosition: 441, length: 1},
    {startPosition: 441, endPosition: 477, length: 2},
    {startPosition: 477, endPosition: 622, length: 1},
    {startPosition: 622, endPosition: 698, length: 2},
    {startPosition: 698, endPosition: 868, length: 1},
    {startPosition: 868, endPosition: 883, length: 2},
    {startPosition: 883, endPosition: 890, length: 1},
    {startPosition: 890, endPosition: 894, length: 2},
    {startPosition: 894, endPosition: 895, length: 1},
    {startPosition: 895, endPosition: 899, length: 2},
    {startPosition: 899, endPosition: 917, length: 1},
    {startPosition: 917, endPosition: Infinity, length: 0},
];

describe('TextSegmentCollection', function() {
    beforeEach(startStore);
    beforeEach(function() {
        this.ontology = new Graph(mockOntology);
        this.items = new Graph();
        this.flat = new FlatCollection(this.items);
        this.segments = new SegmentCollection(this.flat);
    });
    afterEach(endStore);

    it('starts with a single segment', function() {
        expect(this.segments.length).toBe(1);
        const segment = this.segments.at(0);
        expect(segment.get('startPosition')).toBe(0);
        expect(segment.get('endPosition')).toBe(Infinity);
    });

    it('updates incrementally', async function() {
        // First annotation, from position 15 to 35.
        this.items.add(mockItems.slice(0, 5));
        expect(this.segments.length).toBe(1);
        await event(this.flat, 'complete:all');
        expect(this.segments.length).toBe(3);
        expect(this.segments.map('startPosition')).toEqual([0, 15, 34]);
        // Next two annotations, from 77 to 98 and from 77 to 107.
        this.items.add(mockItems.slice(5, 16));
        await event(this.flat, 'complete:all');
        expect(this.segments.length).toBe(6);
        expect(this.segments.map('startPosition')).toEqual(
            [0, 15, 34, 77, 98, 107]
        );
        // Final two, from 15 to 16 and from 355 to 391.
        this.items.add(mockItems.slice(16));
        await event(this.flat, 'complete:all');
        expect(this.segments.length).toBe(9);
        expect(this.segments.map('startPosition')).toEqual(edges.slice(0, -1));
    });

    it('is coherent and complete', async function() {
        this.items.add(mockItems);
        await event(this.flat, 'complete:all');
        expect(this.segments.map('startPosition')).toEqual(edges.slice(0, -1));
        expect(this.segments.map('endPosition')).toEqual(edges.slice(1));
        expect(this.segments.map(s => s.annotations.map('id').sort())).toEqual([
            [],
            [item('100'), item('103')],
            [item('100')],
            [],
            [item('101'), item('102')],
            [item('102')],
            [],
            [item('104')],
            [],
        ]);
    });

    it('is coherent and complete for challenging cases', function() {
        this.flat.add(map(challenging, surrogate => {
            const node = new Node();
            const added = new FlatCollection.prototype.model(node);
            return added.set(surrogate);
        }));
        each(insertionOrder, id => {
            const flat = this.flat.get(id);
            flat.trigger('complete', flat);
        });
        expect(this.segments.toJSON()).toEqual(expectedSegments);
    });

    it('removes annotations automatically', async function() {
        this.items.add(mockItems);
        await event(this.flat, 'complete:all'),
        this.items.remove(item('100'));
        expect(
            this.segments.at(1).annotations.get(item('100'))
        ).toBeUndefined();
        expect(
            this.segments.at(2).annotations.get(item('100'))
        ).toBeUndefined();
        this.items.remove(item('104'));
        expect(
            this.segments.at(7).annotations.get(item('104'))
        ).toBeUndefined();
    });

    it('resets with the underlying collection', async function() {
        this.items.add(mockItems);
        await event(this.flat, 'complete:all');
        this.items.reset();
        expect(this.segments.length).toBe(1);
        this.items.add(mockItems);
        await event(this.flat, 'complete:all');
        expect(this.segments.length).toBe(9);
    });
});
