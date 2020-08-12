import { ViewOptions as BaseOpt } from 'backbone';
import { extend, map } from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import View from '../core/view';
import Graph from '../jsonld/graph';
import Node from '../jsonld/node';
import { dcterms, owl } from '../jsonld/ns';
import explorerChannel from '../explorer/radio';

import relatedItemsTemplate from './related-items-template';

import { getLabel } from '../utilities/utilities';
import ItemSummaryBlockView from '../utilities/item-summary-block/item-summary-block-view';
import RelatedItemsRelationView from './related-items-relation-view';
import { applicablePredicates, relationsFromModel } from './relation-utilities';

export interface ViewOptions extends BaseOpt<Node> {
    model: Node;
}

export default class RelatedItemsView extends View<Node> {
    predicates: Graph;
    relations: RelatedItemsRelationView[];
    /**
     * Keep track of the currently highlighted summary block
     */
    currentlyHighlighted: ItemSummaryBlockView;

    constructor(options?: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.predicates = applicablePredicates(this.model);
        this.relations = [];
        return this;
    }

    initRelationViews(relations: Collection): this {
        const byPredicate = relations.groupBy(r => r.get('predicate').id);
        this.relations = map(byPredicate, this.makeRelationView.bind(this)) as any;
        return this;
    }

    makeRelationView(
        relations: Model[],
        predicateId: string
    ): RelatedItemsRelationView {
        const predicate = this.predicates.get(predicateId);
        const view = new RelatedItemsRelationView({
            relationName: getLabel(predicate),
            collection: new Graph(map(relations, r => r.get('object'))),
        });
        view.on('sumblock-clicked', this.onSummaryBlockClicked, this);
        return view;
    }

    render(): this {
        this.relations.forEach(sb => sb.remove());
        this.$el.html(this.template(this));
        if (!this.model) return;
        let summaryList = this.$('.relations');
        const relations = relationsFromModel(this.model, this.predicates);

        relations.once('complete', () => {
            this.initRelationViews(relations);
            this.relations.forEach(sb => sb.render().$el.appendTo(summaryList));
        });
        return this;
    }

    onSummaryBlockClicked(summaryBlock: ItemSummaryBlockView, model: Model): this {
        if (this.currentlyHighlighted && summaryBlock !== this.currentlyHighlighted) {
        }
        this.currentlyHighlighted = summaryBlock;
        explorerChannel.trigger('relItems:itemClick', this, model.get('item'));
        return this;
    }

    onEditButtonClicked(event: JQuery.TriggeredEvent): void {
        explorerChannel.trigger('relItems:edit', this, this.model);
    }
}
extend(RelatedItemsView.prototype, {
    tagName: 'div',
    className: 'related-items explorer-panel',
    template: relatedItemsTemplate,
    events: {
        'click .btn-edit': 'onEditButtonClicked',
    },
});
