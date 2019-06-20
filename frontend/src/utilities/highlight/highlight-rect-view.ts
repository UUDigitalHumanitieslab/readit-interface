import { ViewOptions as BaseOpt } from 'backbone';

import { extend } from 'lodash';
import View from '../../core/view';

import highlightRectTemplate from './highlight-rect-template';

export interface ViewOptions extends BaseOpt {
    /**
     * The rectangle in the DOM that to model the HighligtRect after.
     */
    rect: ClientRect | DOMRect;

    /**
     * The parent element that has 'position:relative' set.
     * Note that the current element will be positioned relative to this parent.
     */
    offset: JQuery.Coordinates;

    /**
     * If applicable, the horizontal (!) scrollOffset.
     * Can be undefined, in which case it defaults to 0.
     */
    scrollOffsetTop: number;

    /**
     * The READ-IT specific cssClass to add to this rect.
     */
    cssClass: string;

    /**
     * Specifies whether this is the last rectangle in a Range.
     * Note that only the last rect in the range will have the delete button.
     */
    isLast: boolean;
}

export default class HighlightRectView extends View {
    /**
     * The rectangle in the DOM that to model the HighligtRect after.
     */
    rect: ClientRect | DOMRect;

    /**
     * The offset to use for the current view. Typically based on the first positioned parent's offset
     * (where 'positioned' means: has position relative, absolute, or fixed).
     */
    offset: JQuery.Coordinates;

    /**
     * The scrollOffset to use for positoning the current view.
     * Typically this shall be the offset of the document (i.e. '$(document).scrollTop().valueOf()').
     */
    scrollOffsetTop: number;

    /**
     * The READ-IT specific cssClass to add to this rect.
     */
    cssClass: string;

    /**
     * Specifies whether this is the last rectangle in a Range.
     * Note that only the last rect in the range will have the delete button.
     */
    isLast: boolean;

    constructor(options?: ViewOptions) {
        if (!options.rect) throw TypeError("rect cannot be null or undefined");
        if (!options.offset) throw TypeError("relativeParent cannot be null or undefined");
        if (!options.cssClass) throw TypeError("cssClass cannot be null or undefined");
        if (!options.isLast) throw TypeError("isLast cannot be null or undefined");

        super(options);
        this.rect = options.rect;
        this.offset = options.offset;
        this.cssClass = options.cssClass;
        this.isLast = options.isLast;
        this.scrollOffsetTop = options.scrollOffsetTop ? options.scrollOffsetTop : 0;
    }

    render(): this {
        this.$el.html(this.template({ isLast: this.isLast }));

        this.$el.css("top", this.getTop());
        this.$el.css("left", this.getLeft());
        this.$el.css("width", this.rect.width);
        this.$el.css("height", this.rect.height);

        this.$el.addClass(this.cssClass);

        return this;
    }

    getTop(): number {
        return this.rect.top - this.offset.top + this.scrollOffsetTop;
    }

    getLeft(): number {
        return this.rect.left - this.offset.left;
    }
}
extend(HighlightRectView.prototype, {
    tagName: 'highlight-rect',
    className: 'highlight-rect',
    template: highlightRectTemplate,
});
