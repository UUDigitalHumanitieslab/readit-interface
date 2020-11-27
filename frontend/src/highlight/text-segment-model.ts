import Model from '../core/model';
import Collection from '../core/collection';
import FlatItem from '../core/flat-item-model';

/**
 * Highlight segments may be split into two adjacent segments. The original
 * segment is truncated to represent one side. The other side is represented by
 * a newly created instance. `cloneDirection` indicates the side that is
 * represented by the *NEW* instance. In other words, the side that is split
 * off.
 */
export type cloneDirection = 'front' | 'back';

/**
 * A Model subclass that represents a segment of text between two character
 * positions and which may be associated with zero or more annotations.
 *
 * The semantics of a segment are as follows:
 *
 *  - Following the flat annotation convention, `'startPosition'` and
 *    `'endPosition'` attributes are interpreted as the bounds of the text
 *    segment if set.
 *  - If either position is unset or `undefined`, this is interpreted as
 *    indeterminate or unknown. To indicate that a segment represents the
 *    entire text, set the `'startPosition'` to `0` and the `'endPosition'` to
 *    `Infinity` (or the length of the text if known).
 *  - By convention, an annotation may only be associated with a segment if the
 *    entire segment falls within the selected range of the annotation. If this
 *    is not the case, split off the part that falls outside the annotation
 *    first.
 */
export default class TextSegmentModel extends Model {
    annotations: Collection<FlatItem>;

    initialize(attributes?: any, options?: any) {
        const list = new Collection<FlatItem>(options && options.annotations);
        this.annotations = list;
        this.updateListLength(list);
        this.listenTo(list, 'update reset', this.updateListLength);
    }

    updateListLength(list: Collection): void {
        this.set('length', list.length);
    }

    /**
     * Return true if the passed position is within the segment, excluding the
     * bounds.
     */
    envelops(at: number): boolean {
        const start = this.get('startPosition');
        const end = this.get('endPosition');
        return start != null && end != null && start < at && at < end;
    }

    /**
     * Like envelops, but now including the startPosition.
     */
    matchStart(position: number): boolean {
        return this.envelops(position) || this.get('startPosition') == position;
    }

    /**
     * Like envelops, but now including the endPosition.
     */
    matchEnd(position: number): boolean {
        return this.envelops(position) || this.get('endPosition') == position;
    }

    /**
     * Truncate this segment and return a new segment for the range of text
     * that was removed. `clone` indicates whether it is the front or the back
     * that should be moved to the new segment.
     */
    split(at: number, clone: cloneDirection): this {
        if (!this.envelops(at)) return;
        const sibling = this.clone() as this;
        sibling.annotations.reset(this.annotations.models);
        if (clone === 'front') {
            this.set('startPosition', at);
            sibling.set('endPosition', at);
        } else {
            sibling.set('startPosition', at);
            this.set('endPosition', at);
        }
        return sibling;
    }
}
