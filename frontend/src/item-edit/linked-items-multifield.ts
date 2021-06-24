import { extend, after, bind } from 'lodash';
import * as a$ from 'async';

import Model from '../core/model';
import Collection from '../core/collection';
import { CollectionView } from '../core/view';
import { owl } from '../common-rdf/ns';
import ldChannel from '../common-rdf/radio';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';
import ItemGraph from '../common-adapters/item-graph';
import { applicablePredicates, relationsFromModel } from '../utilities/relation-utilities';

import LinkedItemEditor from './linked-item-editor-view';
import AddButton from '../forms/add-button-view';

// Callback used in the commitChanges method.
const commitCallback = a$.asyncify(n => n.save());

/**
 * View class that displays a LinkedItemEditor for each linked item.
 */
export default
    class LinkedItemsMultifield extends CollectionView<Model, LinkedItemEditor> {
    model: Node;
    predicates: Graph;
    changes: Collection;
    addButton: AddButton;

    initialize(): void {
        // Start collecting relations only after both the full ontology has been
        // fetched and the type of the model is known. Otherwise,
        // `this.predicates` will remain empty.
        const kickoff = after(2, bind(this.initAsync, this));
        ldChannel.request('ontology:promise').then(kickoff);
        this.model.when('@type', kickoff);
        this.changes = new Collection();
        this.addButton = new AddButton().on(
            'click', this.addRow, this
        ).render();
    }

    initAsync(): void {
        this.predicates = applicablePredicates(this.model);
        this.collection = relationsFromModel(this.model, this.predicates);
        this.initItems().render().initCollectionEvents();
        this.$el.append(this.addButton.el);
    }

    makeItem(model: Model): LinkedItemEditor {
        const editor = new LinkedItemEditor({ model, collection: this.predicates });
        editor.once('remove', this.removeLinkedItem, this);
        model.on('change', this.updateLinkedItem, this);
        return editor;
    }

    addRow(): this {
        this.collection.add({});
        return this;
    }

    removeLinkedItem(item: Model): this {
        this.registerUnset(item.attributes);
        this.collection.remove(item);
        return this;
    }

    updateLinkedItem(item: Model): void {
        this.registerUnset(item.previousAttributes());
        this.registerSet(item.attributes);
    }

    registerSet(attributes): void {
        if (!attributes.object) return;
        this.changes.push(extend({ action: 'set' }, attributes));
    }

    registerUnset(attributes): void {
        if (!attributes.object) return;
        this.changes.push(extend({ action: 'unset' }, attributes));
    }

    commitChanges(): PromiseLike<void> {
        const affectedItems = new ItemGraph();
        this.changes.forEach(update => {
            const { action, predicate, object } = update.attributes;
            let inverse: Node | Node[] = predicate.get(owl.inverseOf) as Node[];
            if (inverse) {
                inverse = inverse[0];
                object[action](inverse.id, this.model);
                affectedItems.add(object);
            } else {
                this.model[action](predicate.id, object);
                affectedItems.add(this.model);
            }
        });
        return a$.eachLimit(affectedItems.models, 4, commitCallback).then(
            () => this.changes.reset()
        );
    }
}
