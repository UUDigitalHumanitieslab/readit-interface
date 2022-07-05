import { extend } from 'lodash';

import { CollectionView, ViewOptions as BaseOpt } from '../core/view';
import ItemSummaryBlockView from '../item-summary-block/item-summary-block-view';

import relatedItemsRelationTemplate from './related-items-relation-template';

export interface ViewOptions extends BaseOpt {
    relationName: string;
}

export default class RelatedItemsRelationView extends CollectionView {
    relationName: string;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions) {
        this.relationName = options.relationName;
        this.initItems().initCollectionEvents();
        this.listenTo(this.collection, 'focus blur', this.trigger);
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }
}

extend(RelatedItemsRelationView.prototype, {
    className: 'relation',
    template: relatedItemsRelationTemplate,
    container: '.summary-list',
    subview: ItemSummaryBlockView,
});
