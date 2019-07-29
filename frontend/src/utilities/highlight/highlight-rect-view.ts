import { ViewOptions as BaseOpt } from 'backbone';

import { extend } from 'lodash';
import View from '../../core/view';

import highlightRectTemplate from './highlight-rect-template';

export interface ViewOptions extends BaseOpt {
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
    cssClass: string;
    isLast: boolean;

    constructor(options: ViewOptions) {
        if (!options) throw new TypeError("options cannot be null or undefined");
        if (typeof(options.isLast) == 'undefined') throw TypeError("isLast cannot be undefined");
        if (!options.cssClass) throw TypeError("cssClass cannot be null or undefined");
        super(options);
        this.cssClass = options.cssClass;
        this.isLast = options.isLast;
    }

    render(): this {
        this.$el.html(this.template({ isLast: this.isLast }));
        this.$el.addClass(this.cssClass);
        return this;
    }

    /**
     * Set the relevant css attributes to position this rect.
     * @param rect The rectangle in the DOM to model the HighlightRect after.
     * @param offset The parent element that has 'position:relative' set.
     * Note that the current element will be positioned relative to this parent.
     * @param scrollOffsetTop If applicable, the horizontal (!) scrollOffset.
     * Can be undefined, in which case it defaults to 0.
     */
    position(rect: ClientRect | DOMRect, offset: JQuery.Coordinates, scrollOffsetTop: number): this {
        if (!rect) throw TypeError("rect cannot be null or undefined");
        if (!offset) throw TypeError("relativeParent cannot be null or undefined");
        scrollOffsetTop = scrollOffsetTop || 0;

        this.$el.css("top", rect.top - offset.top + scrollOffsetTop);
        this.$el.css("left", rect.left - offset.left);
        this.$el.css("width", rect.width);
        this.$el.css("height", rect.height);
        return this;
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
        this.trigger('hover');
        return this;
    }

    onHoverEnd(): this {
        this.trigger('hoverEnd');
        return this;
    }

    onDelete(event: JQuery.TriggeredEvent): this {
        event.stopPropagation();
        this.trigger('delete');
        return this;
    }

    onClick(): this {
        console.log('click');
        this.trigger('clicked');
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
