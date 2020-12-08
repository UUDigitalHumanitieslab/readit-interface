import { extend, map, after, bind } from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import { CollectionView, ViewOptions as BaseOpt } from '../core/view';
import ldChannel from '../core/radio';
import Graph from '../common-rdf/graph';
import Node from '../common-rdf/node';
import explorerChannel from '../explorer/explorer-radio';
import { announceRoute } from '../explorer/utilities';
import { getLabel } from '../utilities/linked-data-utilities';

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
        this.collection = new Collection();
        this.initItems().initCollectionEvents();
        this.on('announceRoute', announce);
        // Start collecting relations only after both the full ontology has been
        // fetched and the type of the model is known. Otherwise,
        // `this.predicates` will remain empty.
        const kickoff = after(2, bind(this.initPredicates, this));
        ldChannel.request('ontology:promise').then(kickoff);
        this.model.when('@type', kickoff);
    }

    initPredicates(): void {
        this.predicates = applicablePredicates(this.model);
        this.updateRelations(this.model);
        this.listenTo(this.model, 'change', this.updateRelations);
    }

    updateRelations(model: Node): void {
        if (!this.predicates) return;
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
