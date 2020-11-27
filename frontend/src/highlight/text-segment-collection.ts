import { extend, sortedIndexBy, each, range } from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import FlatItem from '../core/flat-item-model';
import FlatCollection from '../core/flat-annotation-collection';
import Segment from './text-segment-model';

// The type of function that may be passed as iteratee to collection methods
// such as `each`, `map`, `filter` and our own custom `eachRange`.
export interface SegmentIteratee<T = void> {
    (segment: Segment, index: number, collection: TextSegmentCollection): T;
}

const startAttribute = 'startPosition';
const endAttribute = 'endPosition';

// Shorthands for expressions that we repeat a lot.
function getStart(model: Model): number {
    return model.get(startAttribute);
}
function getEnd(model: Model): number {
    return model.get(endAttribute);
}

/**
 * Adapter class that represents the underlying FlatAnnotationCollection as a
 * sequence of adjacent TextSegmentModels.
 *
 * Instances of this collection class stay in sync with the underlying
 * collection and keep their contents sorted through binary search. Empty
 * segments are kept in order to maintain the invariant that each position in
 * the text is represented by exactly one segment.
 */
export default class TextSegmentCollection extends Collection<Segment> {
    underlying: FlatCollection;

    /**
     * Like other collection adapters, this one takes the underlying collection
     * as the first constructor parameter instead of an initial list of models.
     */
    constructor(underlying: FlatCollection, options?: any) {
        super(null, options);
        this.initSegments(underlying);
        this.listenTo(underlying, {
            // Underlying flat annotations are ignored until they are complete.
            complete: this.insert,
            remove: this.eject,
            reset: this.proxyReset,
        });
        this.underlying = underlying;
    }

    // Start with a pristine empty segment from 0 to infinity, then insert any
    // annotations from `underlying` that happen to be already complete.
    // Does *not* trigger any events; this is an implementation detail.
    initSegments(underlying: FlatCollection): void {
        this.reset([{
            [startAttribute]: 0,
            [endAttribute]: Infinity,
        } as any], { silent: true });
        underlying.each(this.insertIfComplete.bind(this));
    }

    // Implementation detail of initSegments.
    insertIfComplete(annotation: FlatItem): void {
        if (annotation.complete) this.insert(annotation);
    }

    /**
     * Add `annotation` to the segments to which it applies, possibly splitting
     * segments first in order to ensure that the annotation applies to the
     * whole segment.
     *
     * This is the event handler for the `'complete'` event of the underlying
     * collection and it is where most of the magic happens.
     */
    insert(annotation: FlatItem): void {
        // Position range of the *annotation*.
        const start = getStart(annotation);
        const end = getEnd(annotation);
        // Index of the *segment* that contains `start`.
        let firstIndex = this.findStart(annotation);
        // The segment corresponding to `firstIndex`. We will add `annotation`
        // to it, but we might need to split it first.
        const firstSegment = this.at(firstIndex);
        // `firstIndex.split` is a no-op if `start` coincides with the
        // `startPosition` of `firstSegment`. It returns `undefined` in that
        // case. `this.add` will then also be a no-op that returns `undefined`.
        // Otherwise, both steps return the split-off segment. We use this in
        // the `if`-statement to detect whether we need to increment
        // `firstIndex`.
        // We insert at `firstIndex` in order to keep the segments sorted.
        if (this.add(firstSegment.split(start, 'front'), { at: firstIndex })) {
            // We just inserted the split-off segment before the `firstSegment`,
            // so we need to increment `firstIndex` so that it corresponds to
            // `firstSegment` again.
            ++firstIndex;
        }
        // Index of the segment that contains `end` and the segment itself. It
        // might or might not be the same as `firstSegment`; we don't care.
        let lastIndex = this.findEnd(annotation);
        const lastSegment = this.at(lastIndex);
        // We increment `lastIndex` unconditionally because we need it to be a
        // past-the-end pointer from here on.
        ++lastIndex;
        // Another potential no-op. This time we don't need to detect that.
        this.add(lastSegment.split(end, 'back'), { at: lastIndex });
        // Add `annotation` to all segments in [firstIndex, lastIndex).
        const insertOne = segment => segment.annotations.add(annotation);
        this.eachRange(insertOne, firstIndex, lastIndex);
    }

    /**
     * Remove `annotation` from the segments to which it applies.
     *
     * This is the event handler for the `'remove'` event of the underlying
     * collection. It is not exactly the opposite operation of `insert`; we do
     * not bother to merge adjacent segments if they have equal sets of
     * annotations after removal. This might be interesting to do in case of
     * high annotation turnover, but we don't really expect frequent removal at
     * this time.
     */
    eject(annotation: FlatItem): void {
        if (!annotation.complete) return;
        const ejectOne = segment => segment.annotations.remove(annotation);
        this.eachRange(ejectOne, annotation);
    }

    /**
     * Start over when the underlying collection resets.
     */
    proxyReset(underlying: FlatCollection, options?: any): void {
        this.initSegments(underlying);
        this.trigger('reset', this, options);
    }

    /**
     * Like `Collection.prototype.each`, but restrict iteration to a subset of
     * the segments.
     * @param callback The function that will be applies to each segment in the
     *   range. Receives the same arguments as the iteratee in regular `each`,
     *   i.e., (segment, index, collection).
     * @param annotation If passed, default `first` and `last` to the first
     *   segment containing `annotation` and the segment *after* the last
     *   segment containing `annotation`, respectively.
     * @param first The first index in the range to be iterated over.
     * @param last The index past the end of the range to be iterated over.
     */
    eachRange(callback: SegmentIteratee, annotation: FlatItem, first?: number, last?: number): this;
    eachRange(callback: SegmentIteratee, first: number, last: number): this;
    eachRange(callback, annotation, first, last?): this {
        if (annotation instanceof FlatItem) {
            (first == null) && (first = this.findStart(annotation));
            (last == null) && (last = this.findEnd(annotation) + 1);
        } else {
            [first, last] = [annotation, first];
        }
        const indices = range(first, last);
        each(indices, index => callback(this.at(index), index, this));
        return this;
    }

    /**
     * Return the index of the first segment that contains `annotation`.
     */
    findStart(annotation: FlatItem): number {
        const index = sortedIndexBy(this.models, annotation, getStart);
        if (index === this.length) return index - 1;
        const segment = this.at(index);
        return getStart(segment) === getStart(annotation) ? index : index - 1;
    }

    /**
     * Return the index of the last segment that contains `annotation`.
     */
    findEnd(annotation: FlatItem): number {
        return sortedIndexBy(this.models, annotation, getEnd);
    }
}

extend(TextSegmentCollection.prototype, {
    model: Segment,
});
