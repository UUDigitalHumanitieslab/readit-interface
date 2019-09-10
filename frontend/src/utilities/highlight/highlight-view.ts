import { ViewOptions as BaseOpt } from 'backbone';
import { extend, minBy, sumBy, initial, last } from 'lodash';

import View from '../../core/view';

import Node from '../../jsonld/node';
import HighlightRectView from './highlight-rect-view';
import { AnnotationPositionDetails } from './../annotation-utilities';

export interface ViewOptions extends BaseOpt<Node> {
    /**
     * The oa:Annotation instance to create the highlight for.
     */
    model: Node;

    /**
     * Range object containing the ClientDomRects that the highlight should be based on.
     */
    range: Range;

    /**
     * Position details of the highlight.
     */
    positionDetails: AnnotationPositionDetails;

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
     * Specifies whether the highlight can be deleted. Defaults to false.
     */
    isDeletable: boolean;
}

export default class HighlightView extends View<Node> {
    cssClass: string;
    positionDetails: AnnotationPositionDetails;
    relativeParent: JQuery<HTMLElement>;
    isDeletable: boolean;
    rects: ClientRectList | DOMRectList;
    rectViews: HighlightRectView[];
    lastRect: HighlightRectView;

    constructor(options?: ViewOptions) {
        if (!options.range) throw TypeError("range cannot be null or undefined");
        if (!options.positionDetails) throw TypeError("positionDetails cannot be null or undefined");
        if (!options.relativeParent) throw TypeError("relativeParent cannot be null or empty");

        super(options);
        this.rects = options.range.getClientRects();
        this.positionDetails = options.positionDetails;
        this.cssClass = options.cssClass;
        this.relativeParent = options.relativeParent;
        this.isDeletable = options.isDeletable || false;
        this.initRectViews();
    }

    render(): this {
        this.$el.append(this.rectViews.map((view) => view.el));
        return this;
    }

    createRectView(rect: ClientRect | DOMRect, scrollTop: number, isLast: boolean): HighlightRectView {
        if (isLast && !this.isDeletable) { isLast = false; }
        let hrv = new HighlightRectView({
            cssClass: this.cssClass,
            isLast: isLast
        });
        this.bindHrvEvents(hrv);
        return hrv.render().position(rect, this.relativeParent.offset(), scrollTop);
    }

    initRectViews() {
        const scrollTop = $(document).scrollTop().valueOf();
        this.rectViews = initial(this.rects).map(
            rect => this.createRectView(rect, scrollTop, false)
        );
        this.rectViews.push(this.createRectView(last(this.rects), scrollTop, true));
    }

    bindHrvEvents(hrv: HighlightRectView): this {
        hrv.on('clicked', this.onClick, this);
        hrv.on('hover', this.onHover, this);
        hrv.on('hoverEnd', this.onHoverEnd, this);
        hrv.on('delete', this.onDelete, this);
        return this;
    }

    getTop(): number {
        return minBy(this.rectViews, (hrv) => { return hrv.$el.offset().top }).$el.offset().top;
    }

    getHeight(): number {
        return sumBy(this.rectViews, (hrv) => { return hrv.$el.outerHeight() });
    }

    onHover() {
        if (this.isDeletable) {
            last(this.rectViews).showDeleteButton();
        }

        this.trigger('hover', this.model);
    }

    onHoverEnd() {
        last(this.rectViews).hideDeleteButton();
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
    tagName: 'div',
    className: 'highlight',
});
