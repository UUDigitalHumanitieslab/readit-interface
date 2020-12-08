import { extend } from 'lodash';

import { CollectionView, ViewOptions as BaseOpt } from '../core/view';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';
import ItemSummaryBlockView from '../item-summary-block/item-summary-block-view';

import relatedItemsRelationTemplate from './related-items-relation-template';

export interface ViewOptions extends BaseOpt {
    relationName: string;
}

export default class RelatedItemsRelationView extends CollectionView<Node> {
    relationName: string;
    summaryBlocks: ItemSummaryBlockView[];

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions) {
        this.relationName = options.relationName;
        this.initItems().initCollectionEvents();
    }

    makeItem(item: Node): ItemSummaryBlockView {
        return new ItemSummaryBlockView({
            model: item,
        }).on({
            click: this.onSummaryBlockClicked,
            hover: this.onSummaryBlockHovered,
        }, this);
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    onSummaryBlockHovered(annotation: Node): void {
        this.trigger('sumblock-hover', annotation);
    }

    onSummaryBlockClicked(summaryBlock: ItemSummaryBlockView, annotation: Node): void {
        this.trigger('sumblock-clicked', summaryBlock, annotation);
    }
}

extend(RelatedItemsRelationView.prototype, {
    className: 'relation',
    template: relatedItemsRelationTemplate,
    container: '.summary-list',
});
