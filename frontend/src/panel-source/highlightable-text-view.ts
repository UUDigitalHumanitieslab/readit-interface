import { extend, filter, constant } from 'lodash';
import { ViewOptions as BaseOpt } from 'backbone';
import { SubViewDescription } from 'backbone-fractal/dist/composite-view';

import Model from '../core/model';
import { CompositeView } from './../core/view';
import Subject from '../common-rdf/subject';
import SegmentModel from '../highlight/text-segment-model';
import SegmentCollection from '../highlight/text-segment-collection';
import HighlightLayer from './highlight-layer-view';
import OverlapDetailsView from './overlap-details-view';

import { getRange } from '../utilities/range-utilities';
import { getScrollTop, animatedScroll, ScrollType } from './../utilities/scrolling-utilities';
import { getPositionDetailsFromRange } from '../utilities/range-utilities';

export interface ViewOptions extends BaseOpt {
    text: string;
    collection: SegmentCollection;

    /**
     * Specify whether the View should only display annotations, or if it allows editing them. Defaults to false.
     */
    isEditable?: boolean;
}

/**
 * A View that enables highlighting in a given text.
 * Important note: each highlight is based on a Range.
 * As a consequence thereof, the coordinates (i.e. positions) of the
 * Range's rectangles can only be correctly calculated AFTER this View
 * is inserted into the DOM.
 */
export default class HighlightableTextView extends CompositeView {
    collection: SegmentCollection;
    textWrapper: JQuery<HTMLElement>;
    positionContainer: JQuery<HTMLElement>;
    highlightLayer: HighlightLayer;
    overlapDetailView: OverlapDetailsView;
    _subviews: SubViewDescription[];

    /**
     * Store some state
     */
    isEditable: boolean;
    isInDOM: boolean;

    constructor(options: ViewOptions) {
        super(options);
        this.isEditable = options.isEditable || false;
        this.isInDOM = false;
        this.prepareText(options.text);
        this.highlightLayer = new HighlightLayer({
            collection: this.collection,
            textContainer: this.textWrapper,
        }).on('click', this.processClick, this);
        this.listenTo(this.collection.underlying, 'focus', this.scrollTo);
        this.textWrapper.on('mouseup', (event) => this.onTextClicked(event));
    }

    prepareText(text: string): this {
        this.textWrapper = $(`<pre class="textWrapper">${text}</pre>`);
        this.positionContainer = $('<div class="position-container">');
        this.textWrapper.appendTo(this.positionContainer);
        this.positionContainer.appendTo(this.$el);
        this.textWrapper.get(0).normalize();
        return this;
    }

    subviews(): SubViewDescription[] {
        return filter(this._subviews, ({ view }) => this[view as string]) as SubViewDescription[];
    }

    activate(): this {
        this.isInDOM = true;
        this.highlightLayer.render();
        this.activate = constant(this);
        return this;
    }

    /**
     * Find the range associated with an annotation, and decide where to center the view (i.e. high range at top, vertically centered otherwise).
     */
    private scroll(scrollTo: Model): void {
        if (!scrollTo) return;
        const rectangle = this.getRectangle(scrollTo);
        if (!rectangle) return;
        const target = getScrollTop(this.$el, rectangle.top, rectangle.height);
        animatedScroll(ScrollType.Top, this.$el, target, undefined, 1.5);
    }

    getRectangle(target: Model): DOMRect | ClientRect {
        if (target instanceof Subject) {
            target = this.collection.underlying.get(target.id);
        }
        const pos = {
            startIndex: target.get('startPosition'),
            endIndex: target.get('endPosition'),
        };
        if (pos.startIndex == null || pos.endIndex == null) return;
        const range = getRange(this.textWrapper, pos);
        return range.getBoundingClientRect();
    }

    /**
     * Scroll to the part of the text associated with an annotation or segment.
     */
    scrollTo(target: Model): this {
        if (this.isInDOM) this.scroll(target);
        return this;
    }

    /**
     * Enable pointer events on the 'textWrapper'.
     * While pointer events are enabled, the SegmentViews under the text
     * do not trigger any mouse events (click, hover, etc), whereas the
     * textWrapper does. This allows selecting (sub)text from a highlight,
     * as opposed to the highlight in its entirety.
     */
    enablePointerEvents(): this {
        this.$('.textWrapper').removeClass('no-pointer-events');
        return this;
    }

    /**
     * Disable pointer events on the 'textWrapper'.
     * The effect is the opposite of enabling them: segmentViews under the text
     * will trigger mouse event (and thus be clickable), whereas the textWrapper
     * does not.
     */
    disablePointerEvents(): this {
        this.$('.textWrapper').addClass('no-pointer-events');
        return this;
    }

    processClick(segment: SegmentModel): void {
        if (this.overlapDetailView) this.onCloseOverlapDetail();

        const annotations = segment.annotations;
        if (annotations.length === 1) {
            const annotation = annotations.at(0);
            annotation.trigger('focus', annotation);
            return;
        }

        this.overlapDetailView = new OverlapDetailsView({
            collection: annotations,
        });
        const rectangle = this.getRectangle(segment);
        let verticalMiddle = (
            rectangle.top + rectangle.bottom
        ) / 2 - this.positionContainer.offset().top;
        this.overlapDetailView.$el.css({
            top: verticalMiddle,
            left: this.positionContainer.outerWidth() / 10,
        }).prependTo(this.positionContainer);
        this.overlapDetailView.once('closed', this.onCloseOverlapDetail, this);
    }

    /**
     * Removes the overlapDetailView after resetting all selections on it.
     */
    onCloseOverlapDetail(): void {
        if (!this.overlapDetailView) return;
        this.overlapDetailView.remove();
        delete this.overlapDetailView;
    }

    onTextClicked(event): void {
        let selection = window.getSelection();
        let range = selection.getRangeAt(0).cloneRange();

        // check if text was selected
        if (range.startOffset !== range.endOffset) {
            this.onTextSelected(event, range);
        }
        else {
            this.disablePointerEvents();
            const element = document.elementFromPoint(event.clientX, event.clientY);
            this.enablePointerEvents();
            $(element).trigger('click');
        }
    }

    onTextSelected(event, range): void {
        event.preventDefault();
        if (!this.isEditable) return;
        if (this.overlapDetailView) this.onCloseOverlapDetail();
        this.trigger('textSelected', range, getPositionDetailsFromRange(this.textWrapper, range));
    }

}

extend(HighlightableTextView.prototype, {
    tagName: 'div',
    className: 'highlightable-text',
    events: {
    },
    _subviews: [{
        view: 'highlightLayer',
        selector: '.position-container',
        method: 'prepend',
    }, {
        view: 'overlapDetailView',
        selector: '.position-container',
        method: 'prepend',
    }],
});
