import { extend, forEach, some, keys, ListIterator } from 'lodash';
import * as a$ from 'async';

import Model from '../core/model';
import Collection from '../core/collection';
import { CollectionView } from '../core/view';
import ldChannel from '../jsonld/radio';
import { rdfs, owl, readit, item } from '../jsonld/ns';
import Graph from '../jsonld/graph';
import Node from '../jsonld/node';
import ItemGraph from '../utilities/item-graph';
import { getLabel, getRdfSuperClasses } from '../utilities/utilities';
import RelationEditor from './relation-editor-view';
import relatedItemsTemplate from './related-items-edit-template';

// Selector of the .field that contains the add button.
const addField = '.rit-add-relation';
// Selector of the control that contains the save button.
const saveControl = '.panel-footer .control:first-child';

/**
 * Helper for filtering properties by matching type of domain or range.
 */
function matchRelatee(direction: string, types: Node[]) {
    return function(property: Node): boolean {
        return some(types, t => property.has(direction, t));
    }
}

/**
 * Returns a Graph with all direct and inverse predicates applicable to model.
 * This function runs entirely sync.
 */
function applicablePredicates(model: Node): Graph {
    const allTypes = getRdfSuperClasses(model.get('@type') as string[]);
    const predicates = new Graph();
    const ontology = ldChannel.request('ontology:graph') as Graph;
    // predicates that can have model in subject position
    predicates.add(ontology.filter(matchRelatee(rdfs.domain, allTypes)));
    // predicates that can have model in object position (need inverse)
    ontology.filter(matchRelatee(rdfs.range, allTypes)).forEach(direct => {
        // inverse might have been added already
        if (predicates.find(
            {[owl.inverseOf]: direct} as unknown as ListIterator<Node, boolean>
        )) return;
        // otherwise, look up or emulate
        let inverse = ontology.find(
            {[owl.inverseOf]: direct} as unknown as ListIterator<Node, boolean>
        );
        if (!inverse) inverse = new Node({
            [rdfs.label]: `inverse of ${getLabel(direct)}`,
            [owl.inverseOf]: direct,
        });
        if (!inverse.has(rdfs.domain)) {
            inverse.set(rdfs.domain, direct.get(rdfs.range))
        }
        if (!inverse.has(rdfs.range)) {
            inverse.set(rdfs.range, direct.get(rdfs.domain))
        }
        predicates.add(inverse);
    });
    return predicates;
}

/**
 * Converts individual Node attributes to (predicate, object) models.
 * Some of the models are added async.
 */
function relationsFromModel(model: Node, predicates: Graph) {
    const inverseRelated = ldChannel.request(
        'cache:inverse-related',
        model,
    ) as ItemGraph;
    // First, direct relations sourced from the model itself
    const relations = new Collection();
    const attributes = keys(model.attributes);
    forEach(attributes, a => {
        const predicate = predicates.get(a);
        if (!predicate) return;
        (model.get(a, {'@type': '@id'}) as Node[]).forEach(object =>
            object.id.startsWith(item()) && relations.add({predicate, object})
        );
    });
    // Next, inverse relations sourced from other Nodes
    inverseRelated.ready(() => inverseRelated.forEach(node => {
        const attributes = keys(node.attributes);
        attributes.forEach(a => {
            const direct = predicates.get(a);
            if (!direct || !node.has(a, model)) return;
            let inverse: Node | Node[] = direct.get(owl.inverseOf) as Node[];
            if (inverse) {
                inverse = inverse[0];
            } else {
                inverse = predicates.find({
                    [owl.inverseOf]: direct,
                } as unknown as ListIterator<Node, boolean>);
            }
            relations.add({predicate: inverse, object: node});
        })
    }));
    return relations;
}

/**
 * Callback used in the commitChanges method.
 */
const commitCallback = a$.asyncify(n => n.save());

/**
 * View class that displays a RelationEditor for each related item.
 */
export default
class RelatedItemsEditor extends CollectionView<Model, RelationEditor> {
    model: Node;
    predicates: Graph;
    changes: Collection;

    initialize(): void {
        this.predicates = applicablePredicates(this.model);
        this.collection = relationsFromModel(this.model, this.predicates);
        this.initItems().render().initCollectionEvents();
        this.changes = new Collection();
    }

    makeItem(model: Model): RelationEditor {
        const editor = new RelationEditor({model, collection: this.predicates});
        editor.once('remove', this.removeRelation, this);
        model.on('change', this.updateRelation, this);
        return editor;
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    placeItems(): this {
        // ensure the add button stays at the bottom.
        super.placeItems();
        this.$(addField).appendTo(this.$(this.container));
        return this;
    }

    resetIndicators(): this {
        this.$(`${saveControl} button`)
            .removeClass('is-loading is-success is-danger')
            .children('.icon').remove();
        this.$(`${addField} button`).prop('disabled', false);
        return this;
    }

    indicateProgress(): this {
        this.resetIndicators();
        this.$(`${saveControl} button`).addClass('is-loading');
        this.$(`${addField} button`).prop('disabled', true);
        return this;
    }

    indicateSuccess(): this {
        this.resetIndicators();
        this.$(`${saveControl} button`).addClass('is-success').append(`
            <span class="icon is-right"><i class="fas fa-check"></i></span>
        `);
        return this;
    }

    indicateError(): this {
        this.resetIndicators();
        this.$(`${saveControl} button`).addClass('is-danger').append(`
            <span class="icon is-right">
                <i class="fas fa-exclamation-triangle"></i>
            </span>
        `);
        return this;
    }

    submit(event: JQuery.TriggeredEvent): this {
        event.preventDefault();
        if (this.changes.isEmpty()) return this;
        this.indicateProgress().commitChanges().then(
            this.indicateSuccess.bind(this),
            this.indicateError.bind(this),
        );
        return this;
    }

    close(): this {
        return this.trigger('close', this);
    }

    addRelation(): this {
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
        this.resetIndicators();
    }

    registerUnset(attributes): void {
        if (!attributes.object) return;
        this.changes.push(extend({action: 'unset'}, attributes));
        this.resetIndicators();
    }

    commitChanges(): PromiseLike<void> {
        const affectedItems = new ItemGraph();
        this.changes.forEach(update => {
            const {action, predicate, object} = update.attributes;
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

extend(RelatedItemsEditor.prototype, {
    tagName: 'form',
    className: 'explorer-panel',
    template: relatedItemsTemplate,
    container: '.panel-content',
    events: {
        reset: 'close',
        submit: 'submit',
        [`click ${addField}`]: 'addRelation',
    },
});
