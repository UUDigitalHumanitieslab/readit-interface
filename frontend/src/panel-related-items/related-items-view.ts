import { extend, map } from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import { CollectionView, ViewOptions as BaseOpt } from '../core/view';
import Graph from '../jsonld/graph';
import Node from '../jsonld/node';
import explorerChannel from '../explorer/radio';
import { announceRoute } from '../explorer/utilities';
import { getLabel } from '../utilities/utilities';

import relatedItemsTemplate from './related-items-template';
import RelatedItemsRelationView from './related-items-relation-view';
import { applicablePredicates, relationsFromModel } from './relation-utilities';

const announce = announceRoute('item:related', ['model', 'id']);
const getPredicateId = r => r.get('predicate').id;
const groupAsAttributes = (relations, id) => ({ relations, id } as unknown as Model);
const getObject = r => r.get('object');
const getRelatedObjects = model => map(model.get('relations'), getObject);

export interface ViewOptions extends BaseOpt {
    model: Node;
}

export default class RelatedItemsView extends CollectionView {
    model: Node;
    predicates: Graph;

    constructor(options?: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions) {
        this.predicates = applicablePredicates(this.model);
        this.collection = new Collection();
        this.initItems().initCollectionEvents().updateRelations(this.model);
        this.listenTo(this.model, 'change', this.updateRelations);
        this.on('announceRoute', announce);
    }

    updateRelations(model: Node): void {
        const relations = relationsFromModel(this.model, this.predicates);
        relations.once('complete', () => {
            const byPredicate = relations.groupBy(getPredicateId);
            this.collection.set(map(byPredicate, groupAsAttributes));
        });
    }

    makeItem(model: Model): RelatedItemsRelationView {
        const predicate = this.predicates.get(model.id);
        const collection = new Graph(getRelatedObjects(model));
        model.on('change:relations', m => collection.set(getRelatedObjects(m)))
        return new RelatedItemsRelationView({
            relationName: getLabel(predicate),
            model,
            collection,
        }).render().on('sumblock-clicked', this.onSummaryBlockClicked, this);
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    onSummaryBlockClicked(summaryBlock, model: Model): void {
        explorerChannel.trigger('relItems:itemClick', this, model.get('item'));
    }

    onEditButtonClicked(event: JQuery.TriggeredEvent): void {
        explorerChannel.trigger('relItems:edit', this, this.model);
    }
}

extend(RelatedItemsView.prototype, {
    className: 'related-items explorer-panel',
    template: relatedItemsTemplate,
    container: '.relations',
    events: {
        'click .btn-edit': 'onEditButtonClicked',
    },
});
