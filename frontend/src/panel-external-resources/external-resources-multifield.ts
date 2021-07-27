import { extend } from 'lodash';
import * as a$ from 'async';

import Model from '../core/model';
import Collection from '../core/collection';
import { CollectionView } from '../core/view';
import { rdfs, owl } from '../common-rdf/ns';
import ItemGraph from '../common-adapters/item-graph';

import ExternalResourceEditItem from './external-resource-edit-item-view';

const commitCallback = a$.asyncify(n => n.save());

const externalAttributes = [
    rdfs.seeAlso,
    owl.sameAs
];

/**
 * View class that displays an edit item for each related item.
 */
export default class ExternalResourcesMultifield extends CollectionView {
    changes: Collection;

    initialize(): void {
        this.collection = new Collection();
        this.changes = new Collection();
        this.model.when('@type', this.collectExternal, this);
        this.initItems().render().initCollectionEvents();
        this.changes = new Collection();
    }

    collectExternal(model: Model): void {
        externalAttributes.forEach(predicate => {
            const objects = this.model.get(predicate) as Model[];
            objects && objects.forEach(object => {
                this.collection.add({predicate, object})
            });
        });
    }

    makeItem(model: Model): ExternalResourceEditItem {
        const itemEditor = new ExternalResourceEditItem({model});
        itemEditor.once('remove', this.removeExternalResource, this);
        this.listenTo(model, 'change', this.updateExternalResource);
        return itemEditor;
    }

    addRow(): this {
        this.collection.add({});
        return this;
    }

    removeExternalResource(view: ExternalResourceEditItem, resource: Model): this {
        this.registerUnset(resource.attributes);
        this.collection.remove(resource);
        return this;
    }

    updateExternalResource(resource: Model): void {
        this.registerUnset(resource.previousAttributes());
        this.registerSet(resource.attributes);
    }

    registerSet(attributes): void {
        if (!attributes.object || !attributes.predicate) return;
        this.changes.push(extend({action: 'set'}, attributes));
    }

    registerUnset(attributes): void {
        if (!attributes.object || !attributes.predicate) return;
        this.changes.push(extend({action: 'unset'}, attributes));
    }

    commitChanges(): PromiseLike<void> {
        const affectedItems = new ItemGraph();
        this.changes.forEach(update => {
            const {action, predicate, object} = update.attributes;
            this.model[action](predicate, object);
            affectedItems.add(this.model);
        });
        return a$.each(affectedItems.models, commitCallback).then(
            () => this.changes.reset()
        );
    }
}
