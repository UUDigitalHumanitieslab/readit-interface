import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from './../../core/view';

import Node from './../../jsonld/node';
import HighlightView from './../../utilities/highlight/highlight-view';

import overDetailsTemplate from './overlap-details-template';

export interface ViewOptions extends BaseOpt {
    /**
     * The collection of highlightViews that are overlapping
     */
    hVs: HighlightView[];
}

export default class OverlapDetailsView extends View<Node> {
    details = [];
    hVs: HighlightView[];

    constructor(options: ViewOptions) {
        super();

        this.hVs = options.hVs;

        this.details = options.hVs.map(hV => {
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

    onDetailClicked(event: any) {
        let clickedDetail = $(event.currentTarget);
        let cid = clickedDetail.data('cid');
        let hV = this.hVs.find(h => h.cid == cid);
        this.toggleSelection(clickedDetail);
        this.trigger('detailClicked', hV);
    }

    toggleSelection(clickedDetail: JQuery<HTMLElement>) {
        if (clickedDetail.hasClass('is-selected')) {
            clickedDetail.removeClass('is-selected');
        }
        else {
            this.$('.is-selected').removeClass('is-selected');
            clickedDetail.addClass('is-selected');
        }
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
