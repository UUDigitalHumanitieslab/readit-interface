import { pick, assign, constant, map } from 'lodash';
import { $, ViewOptions as BViewOptions } from 'backbone';

import Model from '../core/model';
import Collection from '../core/collection';
import { CollectionView } from '../core/view';
import FlatItem from '../annotation/flat-item-model';
import FlatCollection from '../annotation/flat-annotation-collection';
import SegmentModel from './text-segment-model';
import LineSegment from './line-segment-view';
import ToggleMixin from '../utilities/category-colors/category-toggle-mixin';
import { getRange } from '../utilities/range-utilities';

// Required options for TextSegmentView.
export interface ViewOptions extends BViewOptions<SegmentModel> {
    model: SegmentModel;
    textContainer: JQuery<HTMLElement>;
    // Element to position relative to.
    offset: HTMLElement;
}

/**
 * Visual presentation of a text segment.
 *
 * A text segment may be visually spread over multiple lines. If the segment is
 * associated with one or more annotations, the presentation consists of at
 * least one `LineSegmentView` for each line on which it is present. Otherwise,
 * the presentation is visually empty, i.e., a `<div>` without any contents.
 *
 * Correct positioning of the line segments requires that the
 * `textContainer` is attached to the `document` and visible. The `activate`
 * method must be called in order to signal that this is the case. Once
 * activated, the view stays in sync with the underlying data.
 *
 * The view visually responds to `'focus'` and `'blur'` events from the
 * datamodel and bubbles up `'click'` events from the DOM.
 */
// Defining first as interface and then as class because of the mixin.
// This is the default export, but the export statement comes after the class
// body because TypeScript doesn't understand it otherwise.
interface TextSegmentView extends ToggleMixin {}
class TextSegmentView extends CollectionView<SegmentModel, LineSegment> {
    textContainer: JQuery<HTMLElement>;
    // Element to position relative to.
    offset: HTMLElement;

    // Constructor just to inform TypeScript about the options type.
    constructor(options: ViewOptions) { super(options); }

    preinitialize(options: ViewOptions) {
        assign(this, pick(options, ['textContainer', 'offset']));
    }

    initialize(options: ViewOptions) {
        this.collection = new Collection();
        this.initItems().initCollectionEvents().render();
        this.listenTo(this.model.annotations, {
            focus: this.focus,
            blur: this.blur,
        });
    }

    /**
     * When an annotation is in focus, hide the color bands of other classes
     * and emphasize this segment with a border and greater opacity.
     */
    focus(annotation: FlatItem): void {
        this.toggleCategories([annotation.get('cssClass')]);
        this.$el.addClass('is-selected');
    }

    /**
     * Undo the effect of `focus`.
     */
    blur(): void {
        this.toggleCategories().$el.removeClass('is-selected');
    }

    /**
     * Signal to the view that the *text* is visible in the document. After the
     * first call this becomes a no-op.
     */
    activate(): this {
        const model = this.model;
        const annotations = model.annotations;
        this.listenTo(model, 'change', this.onPositionChange);
        this.listenTo(annotations, 'update', this.onAnnotationUpdate);
        if (!annotations.isEmpty()) this.position(model);
        // Turn the method into a function that immediately returns `this`.
        this.activate = constant(this);
        return this;
    }

    /**
     * If the positioning changed (because of a split) and the segment is
     * associated with any annotations, call this.position.
     */
    onPositionChange(model: SegmentModel): void {
        const changes = model.changedAttributes();
        if (changes.startPosition || changes.endPosition) {
            if (!model.annotations.isEmpty()) this.position(model);
        }
    }

    /**
     * Check whether we should switch from empty to visual or vice versa.
     */
    onAnnotationUpdate(annotations: FlatCollection): void {
        const collection = this.collection;
        const positionsUninitialized = collection.isEmpty();
        if (annotations.isEmpty()) {
            if (!positionsUninitialized) collection.reset();
        } else if (positionsUninitialized) {
            this.position(this.model);
        }
    }

    /**
     * Compute the positions of all internal line segments and place the
     * corresponding subviews.
     *
     * Precondition: `this.textContainer` is visible in the document and
     * `this.model.annotations` is not empty.
     */
    position(model: SegmentModel): this {
        const positionDetails = {
            startIndex: model.get('startPosition'),
            endIndex: model.get('endPosition'),
        };
        const range = getRange(this.textContainer, positionDetails);
        const rectangles = range.getClientRects();
        const { top, left } = this.offset.getBoundingClientRect();
        // We reset `this.collection` with the positioning data. The
        // `CollectionView` parent class takes care of updating the subviews.
        this.collection.reset(map(rectangles, rect => ({
            top: rect.top - top,
            left: rect.left - left,
            width: rect.width,
            height: rect.height,
        } as any)));
        return this;
    }

    // Overriding `CollectionView.makeItem` in order to specify the
    // `collection`.
    makeItem(model: Model): LineSegment {
        return new LineSegment({ model, collection: this.model.annotations });
    }

    handleClick(event): void {
        this.trigger('click', this.model, this, event);
    }
}
export default TextSegmentView;

// This statement combines mixin assignment and regular prototype extension.
assign(TextSegmentView.prototype, ToggleMixin.prototype, {
    className: 'rit-text-segment',
    events: {
        click: 'handleClick',
    },
});
