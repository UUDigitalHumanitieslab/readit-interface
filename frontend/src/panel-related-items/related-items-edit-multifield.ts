import { extend, after, bind } from 'lodash';
import * as a$ from 'async';

import Model from '../core/model';
import Collection from '../core/collection';
import { CollectionView } from '../core/view';
import { owl } from '../common-rdf/ns';
import ldChannel from '../common-rdf/radio';
import Subject from '../common-rdf/subject';
import Graph from '../common-rdf/graph';
import ItemGraph from '../common-adapters/item-graph';
import { applicablePredicates, relationsFromModel } from '../utilities/relation-utilities';

import RelationEditor from './relation-editor-view';

// Callback used in the commitChanges method.
const commitCallback = a$.asyncify(n => n.save());

/**
 * View class that displays a RelationEditor for each related item.
 */
export default
class RelatedItemsMultifield extends CollectionView<Model, RelationEditor> {
    model: Subject;
    predicates: Graph;
    changes: Collection;

    initialize(): void {
        // Start collecting relations only after both the full ontology has been
        // fetched and the type of the model is known. Otherwise,
        // `this.predicates` will remain empty.
        const kickoff = after(2, bind(this.initAsync, this));
        ldChannel.request('ontology:promise').then(kickoff);
        this.model.when('@type', kickoff);
        this.changes = new Collection();
    }

    initAsync(): void {
        this.predicates = applicablePredicates(this.model);
        this.collection = relationsFromModel(this.model, this.predicates);
        this.initItems().render().initCollectionEvents();
    }

    makeItem(model: Model): RelationEditor {
        const editor = new RelationEditor({model, collection: this.predicates});
        editor.once('remove', this.removeRelation, this);
        model.on('change', this.updateRelation, this);
        return editor;
    }

    addRow(): this {
        this.collection.add({});
        return this;
    }

    removeRelation(view: RelationEditor, relation: Model): this {
        this.registerUnset(relation.attributes);
        this.collection.remove(relation);
        return this;
    }

    updateRelation(relation: Model): void {
        this.registerUnset(relation.previousAttributes());
        this.registerSet(relation.attributes);
    }

    registerSet(attributes): void {
        if (!attributes.object) return;
        this.changes.push(extend({action: 'set'}, attributes));
    }

    registerUnset(attributes): void {
        if (!attributes.object) return;
        this.changes.push(extend({action: 'unset'}, attributes));
    }

    commitChanges(): PromiseLike<void> {
        const affectedItems = new ItemGraph();
        this.changes.forEach(update => {
            const {action, predicate, object} = update.attributes;
            let inverse: Subject | Subject[] = predicate.get(owl.inverseOf) as Subject[];
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
