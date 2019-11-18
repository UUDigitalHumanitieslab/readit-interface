import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from './../core/view';

import Node from './../jsonld/node';
import HighlightView from './highlight-view';

import overDetailsTemplate from './overlap-details-template';

export interface ViewOptions extends BaseOpt {
    /**
     * The collection of highlightViews that are overlapping
     */
    highlightViews: HighlightView[];
}

export default class OverlapDetailsView extends View<Node> {
    details = [];
    hVs: HighlightView[];

    constructor(options: ViewOptions) {
        super();

        this.hVs = options.highlightViews;

        this.details = options.highlightViews.map(hV => {
            return {
                cid: hV.cid,
                cssClass: hV.cssClass,
                text: hV.getText(),
            }
        });
    }

    render(): this {
        this.$el.html(this.template(this));
        return this;
    }

    position(verticalMiddle: number, parentWidth: number): this {
        let offsetLeft = parentWidth / 10;
        this.$el.css("top", verticalMiddle);
        this.$el.css("left", offsetLeft);
        return this;
    }

    getHighlightView(cid): HighlightView {
        return this.hVs.find(h => h.cid == cid);
    }

    onDetailClicked(event: any) {
        let clickedDetail = $(event.currentTarget);
        let cid = clickedDetail.data('cid');
        let hV = this.getHighlightView(cid);
        this.trigger('detailClicked', hV);
    }

    getDetail(hV: HighlightView): JQuery<HTMLElement> {
        return this.$(`.overlap-detail[data-cid='${hV.cid}']`);
    }

    select(hV: HighlightView): this {
        let detail = this.getDetail(hV);
        detail.addClass('is-selected');
        return this;
    }

    unSelect(hV: HighlightView): this {
        let detail = this.getDetail(hV);
        detail.removeClass('is-selected');
        return this;
    }

    /**
     * Unselect all overlap details
     */
    resetSelection(): this {
        this.$('.is-selected').removeClass('.is-selected');
        return this;
    }

    onCloseClicked(event: any) {
        this.trigger('closed');
    }
}
extend(OverlapDetailsView.prototype, {
    tagName: 'div',
    className: 'box overlap-details',
    template: overDetailsTemplate,
    events: {
        'click .overlap-detail': 'onDetailClicked',
        'click .close': 'onCloseClicked'
    }
});
