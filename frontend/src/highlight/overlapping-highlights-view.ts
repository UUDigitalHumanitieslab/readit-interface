import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';

import View from './../core/view';
import Node from './../jsonld/node';

import { AnnotationPositionDetails } from '../utilities/annotation-utilities';
import HighlightView from './highlight-view';


export interface ViewOptions extends BaseOpt<Node> {
    /**
     * Range object containing the ClientDomRects that the overlap view should be based on.
     */
    range: Range;

    /**
     * Position details of the highlight.
     */
    positionDetails: AnnotationPositionDetails;

    /**
    * The first positioned parent, i.e. with position relative, absolute or fixed,
    * relative to which the highlight will be positioned.
    */
    relativeParent: JQuery<HTMLElement>;

    /**
     * The overlapping highlights.
     */
    highlights: HighlightView[];
}

export default class OverlappingHighlightsView extends View {
    hV: HighlightView;
    overlappingHVs: HighlightView[];

    constructor(options: ViewOptions) {
        if (!options.range) throw TypeError("range cannot be null or empty");
        if (!options.positionDetails) throw TypeError("positionDetails cannot be null or undefined");
        if (!options.relativeParent) throw TypeError("relativeParent cannot be null or empty");

        super(options);
        this.overlappingHVs = options.highlights;

        this.hV = new HighlightView({
            model: undefined,
            cssClass: 'is-overlap',
            range: options.range,
            positionDetails: options.positionDetails,
            relativeParent: options.relativeParent,
            isDeletable: false
        });

        this.bindEvents(this.hV);
    }

    render(): this {
        if (this.hV) this.hV.$el.detach();
        this.hV.render().$el.appendTo(this.$el);
        return this;
    }

    getHeight(): number {
        return this.hV.getHeight();
    }

    /**
     *  Get the top of the View, relative to 0,0 of the document.
     */
    getTop(): number {
        return this.hV.getTop();
    }

    /**
     *  Get the vertical middle of the View, relative to 0,0 of the document.
     */
    getVerticalMiddle(): number {
        let height = this.getHeight();
        return (this.getTop() + height) - (height / 2);
    }

    getPositionDetails(): AnnotationPositionDetails {
        return this.hV.positionDetails;
    }

    bindEvents(hV: HighlightView) {
        hV.on('click', this.onClick, this);
        hV.on('hover', this.onHover, this);
        hV.on('hoverEnd', this.onHoverEnd, this);
    }

    onHover(node: Node) {
        this.trigger('hover');
    }

    onHoverEnd(node: Node) {
        this.trigger('hoverEnd');
    }

    onClick(rect: ClientRect | DOMRect) {
        this.trigger('click', this.overlappingHVs, this);
    }
}
extend(OverlappingHighlightsView.prototype, {
    tagName: 'div',
    className: 'overlappping-highlight',
    events: {
    }
});
