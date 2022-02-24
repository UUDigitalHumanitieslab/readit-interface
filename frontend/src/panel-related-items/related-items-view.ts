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
    model: Node;
    predicates: Graph;
    relations: Collection;
    relatedItems: Collection<Node>;
    relatedFlat: FlatCollection;
    itemSerial: string;

    initialize() {
        this.relations = new Collection();
        this.relations.modelId = combinedId;
        this.relatedItems = new MappedCollection(this.relations, getObject);
        this.relatedItems.stopListening(this.relations, 'remove');
        this.relatedFlat = new FlatCollection(this.relatedItems).on({
            focus: this.openItem,
            blur: this.closeItem,
        }, this);
        this.collection = new Collection();
        this.initItems().initCollectionEvents();
        this.on('announceRoute', announce);
        // Start collecting relations only after both the full ontology has been
        // fetched and the type of the model is known. Otherwise,
        // `this.predicates` will remain empty.
        const kickoff = after(2, bind(this.initPredicates, this));
        ldChannel.request('ontology:promise').then(kickoff);
        this.model.when('@type', kickoff);
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
        const relations = relationsFromModel(this.model, this.predicates);
        relations.once('complete', () => this.relations.set(relations.models));
    }

    async addRelation(model: Model): Promise<void> {
        const predicate = model.get('predicate');
        const id = predicate.id;
        if (this.collection.has(id)) return;
        const samePredicate = new FilteredCollection(this.relations, relation =>
            getPredicateId(relation) === id
        ).on('update reset', () => this.trigger('prune-relation', id));
        await Promise.resolve(null);
        const sameFlat = new MappedCollection(samePredicate, relation =>
            this.relatedFlat.get(getObject(relation).id)
        );
        this.collection.add({id, predicate, sameFlat});
    }

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
