import { extend, flatten, intersection, map, some, startsWith } from 'lodash';
import * as a$ from 'async';

import Model from '../core/model';
import Collection from '../core/collection';
import { CollectionView } from '../core/view';
import { rdfs, skos, xsd } from '../common-rdf/ns';
import ldChannel from '../common-rdf/radio';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';

import LinkedItemEditor from './linked-item-editor-view';
import AddButton from '../forms/add-button-view';
import FilteredCollection from '../common-adapters/filtered-collection';
import { getRdfParentNodes, isRdfProperty } from '../utilities/linked-data-utilities';

/**
 * View class that displays a LinkedItemEditor for each linked item.
 */
export default
    class LinkedItemsCollectionView extends CollectionView<Model, LinkedItemEditor> {
    model: Node;
    predicates: Graph;
    changes: Collection;
    addButton: AddButton;

    initialize(): void {
        this.getPredicates().then(() => {
            this.getItems(this.model, this.predicates);
            this.initItems().render().initCollectionEvents();
        });

        this.changes = new Collection();
    }

    async getPredicates() {
        const parents = getRdfParentNodes(this.model.get('@type') as string[]);
        this.predicates = ldChannel.request('visit', store => new FilteredCollection(
            store, node => this.isEditableProperty(node, parents)
        ));
    }

    isEditableProperty(node: Node, parents) {
        const domains = flatten(getRdfParentNodes([node], rdfs.subPropertyOf).map(n => n.get(rdfs.domain)));
        if (isRdfProperty(node) && intersection(domains, parents).length) {
            if (!node.has(rdfs.range)) {
                return true;
            }
            else {
                return some(node.get(rdfs.range), <Node>(n) => (n.id === rdfs.Literal || startsWith(n.id, xsd())));
            }
        }
        else return false;
    }

    getItems(model: Node, predicates: Graph): this {
        predicates.forEach(predicate => {
            this.collection.add(map(model.get(predicate.id), object => ({ predicate, object })));
        });
        return this;
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
        // do some logic here to choose correct data type
        this.changes.push(extend({ action: 'set' }, attributes));
    }

    registerUnset(attributes): void {
        if (attributes.object === undefined) return;
        this.changes.push(extend({ action: 'unset' }, attributes));
    }

    validatePrefLabel(): boolean {
        const prefLabels = this.collection.filter(model => model.get('predicate') && model.get('predicate').id === skos.prefLabel);
        return some(prefLabels, label => label.get('object'))
    }

    commitChanges(): void {
        this.changes.forEach(update => {
            const { action, predicate, object } = update.attributes;
            this.model[action](predicate.id, object);
        });
        this.changes.reset();
    }
}
