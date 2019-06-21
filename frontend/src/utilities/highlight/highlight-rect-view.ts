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
    rect: ClientRect | DOMRect;
    offset: JQuery.Coordinates;
    scrollOffsetTop: number;
    cssClass: string;
    isLast: boolean;

    constructor(options?: ViewOptions) {
        if (!options.rect) throw TypeError("rect cannot be null or undefined");
        if (!options.offset) throw TypeError("relativeParent cannot be null or undefined");
        if (!options.cssClass) throw TypeError("cssClass cannot be null or undefined");
        if (typeof(options.isLast) == 'undefined') throw TypeError("isLast cannot be undefined");

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

    showDeleteButton(): this {
        this.$('.delete-highlight').css('display', 'block');
        return this;
    }

    hideDeleteButton(): this {
        this.$('.delete-highlight').css('display', 'none');
        return this;
    }

    onHover(): this {
        this.trigger('hover', this.rect);
        return this;
    }

    onHoverEnd(): this {
        this.trigger('hoverEnd', this.rect);
        return this;
    }

    onDelete(event: JQuery.TriggeredEvent): this {
        event.stopPropagation();
        this.trigger('delete', this.rect);
        return this;
    }

    onClick(): this {
        console.log('click');
        this.trigger('clicked', this.rect);
        return this;
    }
}
extend(HighlightRectView.prototype, {
    tagName: 'highlight-rect',
    className: 'highlight-rect',
    template: highlightRectTemplate,
    events: {
        'click .delete-highlight': 'onDelete',
        'click': 'onClick',
        'mouseenter': 'onHover',
        'mouseleave': 'onHoverEnd',
    }
});
