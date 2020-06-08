import { extend } from 'lodash';
import * as a$ from 'async';

import Model from '../core/model';
import Collection from '../core/collection';
import { CollectionView } from '../core/view';
import { owl } from '../jsonld/ns';
import Graph from '../jsonld/graph';
import Node from '../jsonld/node';
import ItemGraph from '../utilities/item-graph';

import externalResourcesEditTemplate from './external-resources-edit-template';
import ExternalResourceEditItem from './external-resource-edit-item-view';

const commitCallback = a$.asyncify(n => n.save());

// Selector of the .field that contains the add button.
const addField = '.rit-add-external';
// Selector of the .control that contains the save button.
const saveControl = '.panel-footer .control:first-child';

/**
 * View class that displays a RelationEditor for each related item.
 */
export default
class ExternalResourcesEditView extends CollectionView<Node> {
    model: Node;
    predicates: Graph;
    changes: Collection;

    initialize(): void {
        this.initItems().render().initCollectionEvents();
        this.changes = new Collection();
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    makeItem(model: Model): ExternalResourceEditItem {
        const itemEditor = new ExternalResourceEditItem({model});
        this.listenTo(itemEditor, 'change', this.updateExternalResource);
        return itemEditor;
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
        return this.trigger('externalItems:edit-close', this);
    }

    updateExternalResource(resource): void {
        this.changes.push(resource);
    }

    // registerSet(attributes): void {
    //     if (!attributes.object) return;
    //     this.changes.push(extend({action: 'set'}, attributes));
    //     this.resetIndicators();
    // }

    // registerUnset(attributes): void {
    //     if (!attributes.object) return;
    //     this.changes.push(extend({action: 'unset'}, attributes));
    //     this.resetIndicators();
    // }

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

extend(ExternalResourcesEditView.prototype, {
    tagName: 'form',
    className: 'explorer-panel',
    template: externalResourcesEditTemplate,
    container: '.panel-content',
    events: {
        reset: 'close',
        submit: 'submit',
    },
});
