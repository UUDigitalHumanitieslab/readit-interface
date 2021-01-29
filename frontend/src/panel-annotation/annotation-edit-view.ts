import { extend, invokeMap, bindAll, uniqueId } from 'lodash';
import 'select2';

import { CompositeView } from '../core/view';
import ldChannel from '../common-rdf/radio';
import { oa, rdf, skos } from '../common-rdf/ns';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';

import ItemEditor from '../item-edit/item-edit-view';
import PickerView from '../forms/base-picker-view';
import FilteredCollection from '../common-adapters/filtered-collection';
import ItemGraph from '../common-adapters/item-graph';
import ClassPickerView from '../forms/ontology-class-picker-view';
import ItemMetadataView from '../item-metadata/item-metadata-view';
import SnippetView from '../snippet/snippet-view';
import { isRdfsClass, isBlank } from '../utilities/linked-data-utilities';
import { placeholderClass } from '../utilities/annotation-utilities';
import {
    savePlaceholderAnnotation,
} from '../utilities/annotation-creation-utilities';
import explorerChannel from '../explorer/explorer-radio';

import FlatItem from '../common-adapters/flat-item-model';
import FlatCollection from '../common-adapters/flat-item-collection';

import { announceRoute } from './utilities';
import annotationEditTemplate from './annotation-edit-template';

/**
 * Helper function in order to pass the right classes to the classPicker.
 */
function getOntologyClasses() {
    const ontology = ldChannel.request('ontology:graph') || new Graph();
    return new FilteredCollection<Node, Graph>(ontology, isRdfsClass);
}

const announce = announceRoute(true);

export default class AnnotationEditView extends CompositeView<FlatItem> {
    collection: FlatCollection;
    metadataView: ItemMetadataView;
    classPicker: ClassPickerView;
    snippetView: SnippetView;
    userIsOwner: boolean;
    itemPicker: PickerView;
    itemOptions: ItemGraph;
    itemEditor: ItemEditor;

    initialize() {
        this.itemOptions = new ItemGraph();
        this.itemOptions.comparator = this.sortOptions;
        this.itemPicker = new PickerView({collection: this.itemOptions});
        this.itemPicker.on('change', this.selectItem, this);
        // this.itemPicker.$('select').select2();
        this.classPicker = new ClassPickerView({
            collection: getOntologyClasses(),
            preselection: this.model.get('class'),
        }).on('select', this.selectClass, this).render();
        this.snippetView = new SnippetView({ model: this.model }).render();

        this.model.when('annotation', this.processAnnotation, this);
        this.model.when('class', (model, cls) => this.selectClass(cls));
        bindAll(this, 'propagateItem');
        this.model.when('item', this.propagateItem, this);
    }

    processAnnotation(model: FlatItem, annotation: Node): void {
        this.metadataView = new ItemMetadataView({ model: annotation });
        this.metadataView.render();
        this.on('announceRoute', announce);
        const creator = model.get('creator') as Node;
        const currentUser = ldChannel.request('current-user-uri');
        if (creator && (creator.id === currentUser)) this.userIsOwner = true;
        if (this.userIsOwner) this.render();
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        this.selectClass(this.model.get('class'));

        this.$(".anno-edit-form").validate({
            errorClass: "help is-danger",
            ignore: "",
        });
        return this;
    }

    sortOptions(model1, model2): number {
        if (model1.get(skos.prefLabel) < model2.get(skos.prefLabel)) {
            return -1;
        }
        if (model1.get(skos.prefLabel) > model2.get(skos.prefLabel)) {
            return 1;
        }
        else return 0;
    }

    submit(): this {
        if (this.model.isNew() || isBlank(this.model.get('annotation'))) {
            this.submitNewAnnotation();
        } else {
            this.submitItem().then(this.submitOldAnnotation.bind(this));
        }
        return this;
    }

    submitItem(): Promise<boolean> {
        let newItem = false;
        const item = this.model.get('item');
        if (!item) return Promise.resolve(newItem);
        if (item.isNew() || isBlank(item)) {
            newItem = true;
            if (!item.collection) this.itemOptions.add(item);
        }
        return new Promise((resolve, reject) => {
            item.save();
            item.once('sync', () => resolve(newItem));
            item.once('error', reject);
        });
    }

    submitNewAnnotation(): void {
        savePlaceholderAnnotation(
            this.model,
            (error, results) => {
                if (error) return console.debug(error);
                // const anno = results.annotation;
                // this.collection.underlying.add(anno);
                // const flat = this.collection.get(anno.id);
                explorerChannel.trigger('annotationEditView:saveNew', this, this.model, results.items);
            }
        );
    }

    submitOldAnnotation(newItem: boolean): void {
        const annotation = this.model.get('annotation');
        annotation.save({patch: true});
        explorerChannel.trigger('annotationEditView:save', this, this.model, newItem);
    }

    reset(): this {
        this.trigger('reset');
        return this;
    }

    selectClass(cls: Node): this {
        if (!cls || cls === placeholderClass) return this;
        this.$('.hidden-input').val(cls.id).valid();
        if (cls !== this.model.get('class')) {
            const annotation = this.model.get('annotation');
            annotation.unset(oa.hasBody);
            annotation.set(oa.hasBody, cls);
        }
        this.classPicker.select(cls);
        this.itemOptions.query({
            predicate: rdf.type,
            object: cls.id,
        }).then(this.propagateItem);
        this.removeEditor();
        this.$('.item-picker-container').removeClass('is-hidden');
        return this;
    }

    propagateItem(): void {
        const item = this.model.get('item');
        if (!item) return;
        this.itemPicker.val(item.id);
        this.itemPicker.$el.trigger('change');
    }

    selectItem(itemPicker: PickerView, id: string): void {
        this.removeEditor();
        this.setItem(this.itemOptions.get(id));
    }

    setItem(selectedItem?: Node): void {
        const previousItem = this.model.get('item');
        if (previousItem === selectedItem) return;
        const annotation = this.model.get('annotation');
        previousItem && annotation.unset(oa.hasBody, previousItem);
        selectedItem && annotation.set(oa.hasBody, selectedItem);
    }

    createItem(): this {
        if (this.itemEditor) return this;
        const item = new Node({
            '@id': uniqueId('_:'),
            '@type': this.model.get('class').id,
            [skos.prefLabel]: '', // this prevents a failing getLabel
        });
        this.setItem(item);
        this.itemEditor = new ItemEditor({model: item});
        this.$('.item-picker-container').after(this.itemEditor.el);
        return this;
    }

    removeEditor(): this {
        if (this.itemEditor) {
            this.itemEditor.remove();
            delete this.itemEditor;
        }
        this.setItem();
        return this;
    }

    onSaveClicked(event: JQueryEventObject): this {
        event.preventDefault();
        if (this.$(".anno-edit-form").valid()) {
            this.submit();
        }
        return this;
    }

    onCancelClicked(event: JQueryEventObject): this {
        event.preventDefault();
        this.reset();
        if (isBlank(this.model.underlying)) {
            // Remove the placeholder. This will also pop the panels.
            this.collection.underlying.remove(this.model.underlying);
        } else {
            // Not a placeholder, but still remove the panels.
            explorerChannel.trigger('annotationEditView:close', this);
        }
        return this;
    }

    async onDelete(): Promise<void> {
        const annotation = this.model.get('annotation');
        const details = [
            this.model.get('quoteSelector'),
            this.model.get('positionSelector'),
            this.model.get('target'),
        ];
        // We wait for the oa:Annotation to be destroyed, then destroy its
        // target and selectors without waiting whether deletion was successful.
        // Incomplete deletion should not trouble the user.
        await annotation.destroy({ wait: true });
        invokeMap(details, 'destroy');
    }

    onRelatedItemsClicked(event: JQueryEventObject): this {
        this.trigger('add-related-item', this.classPicker.getSelected());
        return this;
    }

    saveOnEnter(event) {
        if (event.keyCode == 13) {
            this.submit();
        }
    }
}

extend(AnnotationEditView.prototype, {
    className: 'annotation-edit-panel explorer-panel',
    template: annotationEditTemplate,
    subviews: [{
        view: 'classPicker',
        selector: '.ontology-class-picker-container',
    }, {
        view: 'itemPicker',
        selector: '.item-picker-container .field:first .control',
    }, {
        view: 'snippetView',
        selector: '.snippet-container',
    }, {
        view: 'metadataView',
        selector: '.metadata-container',
    }, {
        view: 'itemEditor',
        selector: '.item-picker-container',
        method: 'after',
    }],
    events: {
        'submit': 'onSaveClicked',
        'click .btn-cancel': 'onCancelClicked',
        'click .panel-footer button.is-danger': 'onDelete',
        'click .btn-rel-items': 'onRelatedItemsClicked',
        'click .item-picker-container .field:last button': 'createItem',
        'keyup input': 'saveOnEnter',
    },
});
