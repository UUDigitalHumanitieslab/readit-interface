import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from '../core/view';

import Graph from '../jsonld/graph';
import Node from '../jsonld/node';

import relatedItemsTemplate from './related-items-template';

import { dcterms } from '../jsonld/ns';
import { getLabelFromId } from '../utilities/utilities';
import ItemSummaryBlockView from '../utilities/item-summary-block/item-summary-block-view';
import RelatedItemsRelationView from './related-items-relation-view';

export interface ViewOptions extends BaseOpt<Node> {
    model: Node;
    ontology: Graph;
}

export default class RelatedItemsView extends View<Node> {
    ontology: Graph;
    relations: RelatedItemsRelationView[];
    /**
     * Keep track of the currently highlighted summary block
     */
    currentlyHighlighted: ItemSummaryBlockView;

    constructor(options?: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.ontology = options.ontology;
        this.relations = [];

        this.initRelatedItems(this.model);
        this.listenTo(this.model, 'change', this.initRelatedItems);

        return this;
    }

    initRelatedItems(node: Node): this {
        const ignore = ['@id', '@type', dcterms.creator]

        for (let attribute in node.attributes) {
            if (ignore.includes(attribute)) {
                continue;
            }

            let relationLabel = getLabelFromId(attribute);
            let items = this.model.get(attribute, { '@type': '@id' });

            if (items.length > 0) {
                let view = new RelatedItemsRelationView({
                    relationName: relationLabel, collection: new Graph(items), ontology: this.ontology
                });
                view.on('sumblock-clicked', this.onSummaryBlockClicked, this);
                this.relations.push(view);
            }
        }

        return this;
    }

    render(): this {
        if (this.relations) {
            this.relations.forEach(sb => {
                sb.$el.detach();
            });
        }
        this.$el.html(this.template(this));
        let summaryList = this.$('.relations');

        this.relations.forEach(sb => {
            sb.render().$el.appendTo(summaryList);
        });
        return this;
    }

    onSummaryBlockClicked(summaryBlock: ItemSummaryBlockView, annotation: Node): this {
        if (this.currentlyHighlighted && summaryBlock !== this.currentlyHighlighted) {
            this.currentlyHighlighted.toggleHighlight();
        }
        this.currentlyHighlighted = summaryBlock;
        summaryBlock.toggleHighlight();
        this.trigger('click', annotation);
        return this;
    }
}
extend(RelatedItemsView.prototype, {
    tagName: 'div',
    className: 'related-items explorer-panel',
    template: relatedItemsTemplate,
    events: {
    }
});
