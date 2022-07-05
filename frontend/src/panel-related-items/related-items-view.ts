import { extend, map, after, bind } from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import { CollectionView } from '../core/view';
import ldChannel from '../common-rdf/radio';
import Graph from '../common-rdf/graph';
import Node from '../common-rdf/node';
import MappedCollection from '../common-adapters/mapped-collection';
import FilteredCollection from '../common-adapters/filtered-collection';
import FlatCollection from '../common-adapters/flat-item-collection';
import explorerChannel from '../explorer/explorer-radio';
import { announceRoute } from '../explorer/utilities';
import { getLabel, getLabelFromId } from '../utilities/linked-data-utilities';
import { applicablePredicates, relationsFromModel } from '../utilities/relation-utilities';

import relatedItemsTemplate from './related-items-template';
import RelatedItemsRelationView from './related-items-relation-view';

const announce = announceRoute('item:related', ['model', 'id']);
const getPredicateId = r => r.get('predicate').id;
const getObject = r => r.get('object');
const combinedId = attr => `${attr.predicate.id}%%%${attr.object.id}`;

export default class RelatedItemsView extends CollectionView {
    // Item of which we will display the related items.
    model: Node;
    // Properties from the ontology that apply to `model`.
    predicates: Graph;
    // `{predicate, object}` pairs to related items.
    relations: Collection;
    // Just the `object`s from `relations`. Noninjective mapping!
    relatedItems: Collection<Node>;
    // Flattened version of `relatedItems`.
    relatedFlat: FlatCollection;
    // Serial number of `model`, i.e., the final part of its IRI.
    itemSerial: string;

    initialize() {
        this.relations = new Collection();
        // We uniquely identify each relation based on the combination of the
        // predicate IRI and the object IRI. This prevents double work on
        // subsequent updates.
        this.relations.modelId = combinedId;
        this.relatedItems = new MappedCollection(this.relations, getObject);
        // Normally, when a model is removed from the underlying collection, a
        // MappedCollection will remove the corresponding mapped model. We
        // prevent this behavior here because the mapping is noninjective. This
        // is a bit of a stop-gap solution, but it should pose no problem in
        // this case.
        this.relatedItems.stopListening(this.relations, 'remove');
        this.relatedFlat = new FlatCollection(this.relatedItems).on({
            focus: this.openItem,
            blur: this.closeItem,
        }, this);
        // Each model in the `collection` represents a group of relations that
        // have a common predicate. Each such group is presented with a subview.
        this.collection = new Collection();
        this.initItems().initCollectionEvents();
        this.on('announceRoute', announce);
        // Start collecting relations only after both the full ontology has been
        // fetched and the type of the model is known. Otherwise,
        // `this.predicates` will remain empty.
        const kickoff = after(2, bind(this.initPredicates, this));
        ldChannel.request('ontology:promise').then(kickoff);
        this.model.when('@type', kickoff);
        // Keep `this.collection` in sync with what is in `this.relations`.
        this.relations.on('add', this.addRelation, this);
        this.on('prune-relation', this.removeRelation);
    }

    initPredicates(): void {
        this.predicates = applicablePredicates(this.model);
        this.updateRelations(this.model);
        this.listenTo(this.model, 'change', this.updateRelations);
    }

    updateRelations(model: Node): void {
        if (!this.predicates) return;
        // TODO: Ideally, `relationsFromModel` should just return a collection
        // that stays in sync with the model.
        const relations = relationsFromModel(this.model, this.predicates);
        relations.once('complete', () => this.relations.set(relations.models));
    }

    // Every time a relation is added, we check whether we already have a group
    // for the predicate of the relation. If not, we add it.
    async addRelation(model: Model): Promise<void> {
        const predicate = model.get('predicate');
        const id = predicate.id;
        if (this.collection.has(id)) return;
        const samePredicate = new FilteredCollection(this.relations, relation =>
            getPredicateId(relation) === id
        ).on('update reset', () => this.trigger('prune-relation', id));
        // We queue the remainder of this function after the end of the current
        // event loop. This ensures that `this.relatedFlat` has a matching
        // `FlatItem` for each object in `this.relations`.
        await Promise.resolve(null);
        const sameFlat = new MappedCollection(samePredicate, relation =>
            this.relatedFlat.get(getObject(relation).id)
        );
        this.collection.add({id, predicate, sameFlat});
    }

    // This event handler is called whenever the collection of one of the
    // subviews updates. We check whether the collection is empty and if so,
    // remove it.
    removeRelation(id: string): void {
        const model = this.collection.get(id);
        if (model.get('sameFlat').length) return;
        this.collection.remove(model);
    }

    makeItem(model: Model): RelatedItemsRelationView {
        const {predicate, sameFlat} = model.attributes;
        return new RelatedItemsRelationView({
            relationName: getLabel(predicate),
            collection: sameFlat,
        }).render();
    }

    renderContainer(): this {
        this.itemSerial = getLabelFromId(this.model.id as string);
        this.$el.html(this.template(this));
        return this;
    }

    openItem(model): void {
        explorerChannel.trigger('relItems:showItem', this, model.get('item'));
    }

    closeItem(model): void {
        explorerChannel.trigger('relItems:hideItem', this, model.get('item'));
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
