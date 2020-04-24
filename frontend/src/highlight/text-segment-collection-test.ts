import { map } from 'lodash';

import { startStore, endStore, event } from '../test-util';
import mockOntology from '../mock-data/mock-ontology';
import mockItems from '../mock-data/mock-items';

import { item } from '../jsonld/ns';
import Graph from '../jsonld/graph';
import FlatCollection from '../annotation/flat-annotation-collection';
import Segment from './text-segment-model';
import SegmentCollection from './text-segment-collection';

const edges = [0, 15, 16, 34, 77, 98, 107, 355, 391, Infinity];

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
