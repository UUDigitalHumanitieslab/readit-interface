import {
    each,
    map,
    random,
    sample,
    sampleSize,
    startCase,
    times,
} from 'lodash';

import { startStore, endStore } from '../test-util';
import mockOntology from '../mock-data/mock-ontology';
import mockItems from '../mock-data/mock-items';
import Collection from '../core/collection';
import Graph from '../common-rdf/graph';
import FlatItem from '../common-adapters/flat-item-model';
import FlatCollection from '../common-adapters/flat-annotation-collection';
import Segment, { cloneDirection } from './text-segment-model';

// An arbitrary, optional limit on the text positions that we randomly generate.
const max = 100000;

function randomSegment(): Segment {
    const start = random(max);
    const end = random(start, max);
    const segment = new Segment({
        startPosition: start,
        endPosition: end,
    });
    return segment;
}

describe('TextSegmentModel', function() {
    beforeEach(startStore);

    beforeEach(function(done) {
        this.ontology = new Graph(mockOntology);
        this.items = new Graph(mockItems);
        this.annotations = new FlatCollection(this.items);
        this.annotations.once('complete:all', done);
    });

    afterEach(endStore);

    it('is born with an annotation collection', function() {
        const length = this.annotations.length;

        const h1 = new Segment();
        expect(h1.annotations).toBeInstanceOf(Collection);
        expect(h1.annotations.length).toBe(0);
        expect(h1.get('length')).toBe(0);

        const h2 = new Segment({x: 'y'}, {
            collection: this.annotations.models,
        });
        expect(h2.annotations).toBeInstanceOf(Collection);
        expect(h2.annotations.length).toBe(length);
        expect(h2.get('length')).toBe(length);
    });

    it('keeps its length attribute in sync with its annotations', function() {
        const h1 = new Segment();
        const modifiers = ['set', 'add', 'remove', 'reset'];
        const annotations = this.annotations.models;
        const length = this.annotations.length;
        // Fuzz test: randomly change the annotations 100 times and check that
        // the behaviour is consistent each time.
        times(100, () => {
            const modifier = sample(modifiers);
            const annotationSample = sampleSize(annotations, random(length));
            h1.annotations[modifier](annotationSample);
            expect(h1.get('length')).toBe(h1.annotations.length);
        });
    });

    describe('envelops', function() {
        const symmetricAttributes = ['startPosition', 'endPosition'];
        // Generate two specs, one for the startPosition and one for the
        // endPosition.
        times(2, () => {
            const [fixed, variable] = symmetricAttributes;
            // Ensure we do the opposite thing in the next round.
            symmetricAttributes.reverse();
            it('returns false if the segment has no ' + fixed, function() {
                const h1 = new Segment();
                // Fuzz test: randomly set or unset the `variable` 100 times and
                // check that it returns `false` regardless of the random
                // argument.
                times(100, () => {
                    // Set 9 out of 10 times, unset the remaining times.
                    if (random(10)) {
                        h1.set(variable, random(max));
                    } else {
                        h1.unset(variable);
                    }
                    // The argument is greater than the `variable` about half of
                    // the time.
                    expect(h1.envelops(random(2 * max))).toBe(false);
                });
            });
        });

        it('returns false if the argument is exactly on the edge', function() {
            const h1 = randomSegment();
            const edges = [h1.get('startPosition'), h1.get('endPosition')];
            each(edges, edge => expect(h1.envelops(edge)).toBe(false));
        });

        it('returns true if the argument is within bounds', function() {
            const h1 = randomSegment();
            const bounds = [
                h1.get('startPosition') + 1,
                h1.get('endPosition') - 1,
            ];
            times(10, () => expect(h1.envelops(random(...bounds))).toBe(true));
        });
    });

    // Generate two suites, one for matchStart and one for matchEnd.
    each(['start', 'end'], side => {
        const method = 'match' + startCase(side);
        const attribute = side + 'Position';
        describe(method, function() {
            it('returns true if the argument is the ' + attribute, function() {
                const h1 = randomSegment();
                expect(h1[method](h1.get(attribute))).toBe(true);
            });

            it('behaves like envelops otherwise', function() {
                const h1 = randomSegment();
                const edge = h1.get(attribute);
                // Fuzz test: try random input 100 times, modifying and
                // resetting h1 occasionally.
                times(100, index => {
                    if (!random(10)) h1.unset(attribute);
                    // Do the last 10 iterations with the other edge unset.
                    if (index === 90) h1.clear();
                    const arg = random(max);
                    if (arg !== edge) {
                        expect(h1[method](arg)).toBe(h1.envelops(arg));
                    }
                    // Restore the hot edge for the next iteration.
                    h1.set(attribute, edge);
                });
            });
        });
    });

    describe('split', function() {
        const directions: cloneDirection[] = ['front', 'back'];
        // The attribute of the original segment that gets truncated when split
        // in the corresponding direction.
        const attributes = ['startPosition', 'endPosition'];

        it('is a no-op if the segment does not envelop the arg', function() {
            const h1 = randomSegment();
            const backup = h1.toJSON();
            // Fuzz test: try random input 100 times and check for consistency.
            times(100, () => {
                const arg = random(max);
                // Note: independent random numbers, may or may not coincide.
                if (!random(10)) h1.unset('startPosition');
                if (!random(10)) h1.unset('endPosition');
                if (!h1.envelops(arg)) {
                    expect(h1.split(arg, sample(directions))).toBeUndefined();
                }
                h1.set(backup);
            });
        });

        it('creates a clone at the selected side', function() {
            each([[], this.annotations.models], annotationSet => {
                each(directions, (direction, hotIdx) => {
                    const h1 = randomSegment();
                    h1.annotations.reset(annotationSet);
                    const edges = map(attributes, h1.get.bind(h1)) as unknown[] as number[];
                    const at = random(edges[0] + 1, edges[1] - 1);
                    const coldIdx = 1 - hotIdx;
                    const h2 = h1.split(at, direction);
                    expect(h2).toBeDefined();
                    expect(h2.constructor).toBe(h1.constructor);
                    expect(h2).not.toBe(h1);
                    expect(h2.annotations).not.toBe(h1.annotations);
                    expect(h2.annotations.length).toBe(h1.annotations.length);
                    h1.annotations.each(
                        anno => expect(h2.annotations.get(anno)).toBe(anno)
                    );
                    expect(h1.get(attributes[hotIdx])).toBe(at);
                    expect(h1.get(attributes[coldIdx])).toBe(edges[coldIdx]);
                    expect(h2.get(attributes[hotIdx])).toBe(edges[hotIdx]);
                    expect(h2.get(attributes[coldIdx])).toBe(at);
                });
            });
        });
    });
});
