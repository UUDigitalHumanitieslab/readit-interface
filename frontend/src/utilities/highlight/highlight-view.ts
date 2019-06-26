import { ViewOptions as BaseOpt } from 'backbone';
import { extend, last } from 'lodash';

import View from '../../core/view';
import Model from './../../core/model';

import Node from '../../jsonld/node';
import HighlightRectView from './highlight-rect-view';

export interface ViewOptions extends BaseOpt<Model> {
    /**
     * The oa:Annotation instance to create the highlight for.
     */
    model: Node;

    /**
     * Range object containing the ClientDomRects that the highlight should be based on.
     */
    range: Range;

    /**
     * The CSS class to use to style the highlight.
     * Is allowed to be null or undefined, but in that case the highlight will not be visible.
     */
    cssClass: string;

    /**
     * The first positioned parent, i.e. with position relative, absolute or fixed,
     * relative to which the highlight will be positioned.
     */
    relativeParent: JQuery<HTMLElement>;

    /**
     * Specifies whether the highlight can be deleted.
     */
    isDeletable: boolean;
}

export default class HighlightView extends View<Node> {
    cssClass: string;
    relativeParent: JQuery<HTMLElement>;
    isDeletable: boolean;
    rects: ClientRectList | DOMRectList;
    rectViews: HighlightRectView[];
    lastRect: HighlightRectView;

    constructor(options?: ViewOptions) {
        if (!options.range) throw TypeError("range cannot be null or undefined");
        if (!options.relativeParent) throw TypeError("relativeParent cannot be null or empty")

        super(options);
        this.rects = options.range.getClientRects();
        this.cssClass = options.cssClass;
        this.relativeParent = options.relativeParent;
        this.isDeletable = options.isDeletable ? options.isDeletable : false;
        this.initRectViews();
    }

    render(): this {
        this.$el.append(this.rectViews.map((view) => view.el));
        return this;
    }

    initRectViews() {
        this.rectViews = [];
        let scrollTop = $(document).scrollTop().valueOf();

        for (var index = 0; index != this.rects.length; index++) {
            let rect = this.rects.item(index);
            let isLast = index == this.rects.length - 1;

            let hrv = new HighlightRectView({
                rect: rect,
                offset: $(this.relativeParent).offset(),
                scrollOffsetTop: scrollTop,
                cssClass: this.cssClass,
                isLast: isLast
            });
            this.rectViews.push(hrv.render());
            this.bindHrvEvents(hrv, isLast);
        }
    }

    bindHrvEvents(hrv: HighlightRectView, isLast: boolean): this {
        hrv.on('clicked', this.onClick, this);
        hrv.on('hover', this.onHover, this);
        hrv.on('hoverEnd', this.onHoverEnd, this);

        if (isLast) {
            hrv.on('delete', this.onDelete, this);
        }

        return this;
    }

    onHover() {
        if (this.isDeletable) {
            last(this.rectViews).showDeleteButton();
        }

        this.trigger('hover', this.model);
    }

    onHoverEnd() {
        if (this.isDeletable) {
            last(this.rectViews).hideDeleteButton();
        }

        this.trigger('hoverEnd', this.model);
    }

    onDelete() {
        // TODO: add proper screen for this
        var really = confirm("Really?");
        if (really) {
            this.$el.detach();
        }
        this.trigger('delete', this.model);
    }

    onClick(rect: ClientRect | DOMRect) {
        this.trigger('clicked', this.model);
    }
}
extend(HighlightView.prototype, {
    tagName: 'highlight',
    className: 'highlight',
});
