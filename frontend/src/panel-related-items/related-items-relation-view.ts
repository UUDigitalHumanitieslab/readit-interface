import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from '../core/view';

import Graph from '../jsonld/graph';
import Node from '../jsonld/node';

import relatedItemsRelationTemplate from './related-items-relation-template';
import AnnoItemSummaryBlockView from '../utilities/anno-item-summary-block-view';

export interface ViewOptions extends BaseOpt<Node> {
    relationName: string;
    /**
     * The items that are object of the relation
     */
    collection: Graph;
    ontology: Graph;
}

export default class RelatedItemsRelationView extends View<Node> {
    relationName: string;
    ontology: Graph;
    summaryBlocks: AnnoItemSummaryBlockView[];

    constructor(options?: ViewOptions) {
        if (!options.ontology) throw new TypeError('ontology cannot be null or undefined');
        if (!options.relationName) throw new TypeError('relationName cannot be null or undefined');
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.relationName = options.relationName;
        this.ontology = options.ontology;
        this.summaryBlocks = [];

        this.collection.each(n => { this.initRelatedItem(n as Node); });

        return this;
    }

    initRelatedItem(item: Node): this {
        let view = new AnnoItemSummaryBlockView({
            model: item,
            ontology: this.ontology
        });
        view.on('click', this.onSummaryBlockClicked, this);
        view.on('hover', this.onSummaryBlockedHover, this);
        this.summaryBlocks.push(view);
        return this;
    }

    render(): this {
        if (this.summaryBlocks) {
            this.summaryBlocks.forEach(sb => {
                sb.$el.detach();
            });
        }
        this.$el.html(this.template(this));
        let summaryList = this.$('.summary-list');

        this.summaryBlocks.forEach(sb => {
            sb.render().$el.appendTo(summaryList);
        });
        return this;
    }

    onSummaryBlockedHover(annotation: Node): this {
        this.trigger('sumblock-hover', annotation);
        return this;
    }

    onSummaryBlockClicked(summaryBlock: AnnoItemSummaryBlockView, annotation: Node): this {
        this.trigger('sumblock-clicked', summaryBlock, annotation);
        return this;
    }
}
extend(RelatedItemsRelationView.prototype, {
    tagName: 'div',
    className: 'relation',
    template: relatedItemsRelationTemplate,
    events: {
    }
});
