import { extend, after, bind, intersection, some, startsWith, isEqual } from 'lodash';
import * as a$ from 'async';

import Model from '../core/model';
import Collection from '../core/collection';
import { CollectionView } from '../core/view';
import { owl, rdf, rdfs, xsd, xsdPrefix, xsdTerms } from '../common-rdf/ns';
import ldChannel from '../common-rdf/radio';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';
import ItemGraph from '../common-adapters/item-graph';
import { applicablePredicates, relationsFromModel } from '../utilities/relation-utilities';

import LinkedItemEditor from './linked-item-editor-view';
import AddButton from '../forms/add-button-view';
import FilteredCollection from '../common-adapters/filtered-collection';
import { getRdfSuperClasses } from '../utilities/linked-data-utilities';

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
        this.getPredicates().then(() => this.initItems().render().initCollectionEvents());
        this.changes = new Collection();
        this.addButton = new AddButton().on(
            'click', this.addRow, this
        ).render();
        this.$el.append(this.addButton.el);
    }

    async getPredicates() {
        const parents = getRdfSuperClasses(this.model.get('@type') as string[]);
        this.predicates = await ldChannel.request('visit', store => new FilteredCollection(store, node => {
            if (node.has(rdfs.domain) && intersection(node.get(rdfs.domain), parents).length) {
                if (!node.has(rdfs.range)) {
                    return true;
                }
                else {
                    return some(node.get(rdfs.range), n => (n.id === rdfs.Literal || startsWith(n.id, xsdPrefix)));
                }
            }
            else return false;
        }));
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

    removeLinkedItem(view: LinkedItemEditor, item: Model): this {
        if (item.attributes) {
            this.registerUnset(item.attributes);
        }
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
