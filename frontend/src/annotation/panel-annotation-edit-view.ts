import { extend, invokeMap, bindAll } from 'lodash';

import View, { ViewOptions as BaseOpt } from '../core/view';
import ldChannel from '../jsonld/radio';
import { oa, rdf, skos } from '../jsonld/ns';
import Node from '../jsonld/node';
import Graph from '../jsonld/graph';

import ItemEditor from '../panel-ld-item/ld-item-edit-view';
import PickerView from '../forms/base-picker-view';
import FilteredCollection from '../utilities/filtered-collection';
import ItemGraph from '../utilities/item-graph';
import ClassPickerView from '../utilities/ontology-class-picker/ontology-class-picker-view';
import ItemMetadataView from '../utilities/item-metadata/item-metadata-view';
import SnippetView from '../utilities/snippet-view/snippet-view';
import { isRdfsClass } from '../utilities/utilities';
import {
    AnnotationPositionDetails,
    getTargetDetails
} from '../utilities/annotation/annotation-utilities';
import {
    composeAnnotation,
    getAnonymousTextQuoteSelector
} from './../utilities/annotation/annotation-creation-utilities';
import explorerChannel from '../explorer/radio';
import { announceRoute } from '../explorer/utilities';

import FlatItem from './flat-item-model';
import FlatCollection from './flat-item-collection';

import annotationEditTemplate from './panel-annotation-edit-template';

/**
 * Helper function in order to pass the right classes to the classPicker.
 */
function getOntologyClasses() {
    const ontology = ldChannel.request('ontology:graph') || new Graph();
    return new FilteredCollection<Node, Graph>(ontology, isRdfsClass);
}

const announce = announceRoute('item:edit', ['model', 'id']);

export interface ViewOptions extends BaseOpt {
    /**
     * The following options should be set in case of a new annotation (i.e.
     * when the model is undefined). If you *also* pass a model, it will be
     * ignored!
     */
    range?: Range;
    positionDetails?: AnnotationPositionDetails;
    source?: Node;
}

export default class AnnotationEditView extends View<FlatItem> {
    collection: FlatCollection;
    positionDetails: AnnotationPositionDetails;
    metadataView: ItemMetadataView;
    classPicker: ClassPickerView;
    snippetView: SnippetView;
    userIsOwner: boolean;
    selectedClass: Node;
    selectedItem: Node;
    itemPicker: PickerView;
    itemOptions: ItemGraph;
    itemEditor: ItemEditor;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions) {
        this.itemOptions = new ItemGraph();
        this.itemPicker = new PickerView({collection: this.itemOptions});
        this.itemPicker.on('change', this.selectItem, this);

        if (options.range) {
            this.positionDetails = options.positionDetails;
            this.model = new FlatItem(getAnonymousTextQuoteSelector(options.range));
            this.model.set('source', options.source);
        }

        this.classPicker = new ClassPickerView({
            collection: getOntologyClasses(),
            preselection: this.model.get('class'),
        }).on('select', this.selectClass, this).render();

        this.snippetView = new SnippetView({
            model: this.model,
        }).render();

        this.model.when('annotation', this.processAnnotation, this);
        this.model.when('class', (model, cls) => this.selectClass(cls), this);
        bindAll(this, 'propagateItem');
        this.model.when('item', this.propagateItem, this);
    }

    processAnnotation(model: FlatItem, annotation: Node): void {
        this.metadataView = new ItemMetadataView({ model: annotation });
        this.metadataView.render();
        this.on('announceRoute', announce);
        const creator = model.get('creator') as Node;
        const currentUser = ldChannel.request('current-user-uri');
        if (creator.id === currentUser) this.userIsOwner = true;
    }

    render(): this {
        this.classPicker.$el.detach();
        this.itemPicker.$el.detach();
        if (this.snippetView) this.snippetView.$el.detach();
        if (this.metadataView) this.metadataView.$el.detach();
        if (this.itemEditor) this.itemEditor.$el.detach();

        this.$el.html(this.template(this));
        if (this.selectedClass) this.selectClass(this.selectedClass);

        this.$(".anno-edit-form").validate({
            errorClass: "help is-danger",
            ignore: "",
        });

        this.$('.ontology-class-picker-container').append(this.classPicker.el);
        this.$('.item-picker-container .field:first .control')
            .append(this.itemPicker.el);
        if (this.snippetView) this.$('.snippet-container').append(this.snippetView.el);
        if (this.metadataView) this.$('.metadata-container').append(this.metadataView.el);
        if (this.itemEditor) {
            this.$('.item-picker-container').after(this.itemEditor.el);
        }
        return this;
    }

    remove() {
        this.metadataView && this.metadataView.remove();
        this.classPicker && this.classPicker.remove();
        this.snippetView && this.snippetView.remove();
        this.itemEditor && this.itemEditor.remove();
        this.itemPicker.remove();
        return super.remove();
    }

    submit(): this {
        if (this.model.isNew()) {
            this.submitNewAnnotation();
        } else {
            const annotation = this.model.get('annotation');
            annotation.unset(oa.hasBody);
            annotation.set(oa.hasBody, this.selectedClass);
            this.submitItem().then(this.submitOldAnnotation.bind(this));
        }
        return this;
    }

    submitItem(): Promise<boolean> {
        let newItem = false;
        const item = this.selectedItem;
        if (!item) return Promise.resolve(newItem);
        if (item.isNew()) {
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
        composeAnnotation(
            this.model.get('source'),
            this.positionDetails,
            this.snippetView.model.underlying as Node,
            this.selectedClass,
            this.selectedItem,
            (error, results) => {
                if (error) return console.debug(error);
                const anno = results.annotation;
                this.collection.underlying.add(anno);
                const flat = this.collection.get(anno.id);
                explorerChannel.trigger('annotationEditView:saveNew', this, flat, results.items);
            }
        );
    }

    submitOldAnnotation(newItem: boolean): void {
        const annotation = this.model.get('annotation');
        this.selectedItem && annotation.set(oa.hasBody, this.selectedItem);
        annotation.save();
        explorerChannel.trigger('annotationEditView:save', this, this.model, newItem);
    }

    reset(): this {
        this.trigger('reset');
        return this;
    }

    selectClass(cls: Node): this {
        this.$('.hidden-input').val(cls.id).valid();
        this.selectedClass = cls;
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
        this.selectedItem = this.itemOptions.get(id);
    }

    createItem(): this {
        if (this.itemEditor) return this;
        this.selectedItem = new Node({
            '@type': this.selectedClass.id,
            [skos.prefLabel]: '', // this prevents a failing getLabel
        });
        this.itemEditor = new ItemEditor({model: this.selectedItem});
        this.$('.item-picker-container').after(this.itemEditor.el);
        return this;
    }

    removeEditor(): this {
        if (!this.itemEditor) return this;
        this.itemEditor.remove();
        delete this.itemEditor;
        delete this.selectedItem;
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
        explorerChannel.trigger('annotationEditView:close', this);
        return this;
    }

    async onDelete(): Promise<void> {
        const annotation = this.model.get('annotation');
        const details = getTargetDetails(annotation);
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
}

extend(AnnotationEditView.prototype, {
    className: 'annotation-edit-panel explorer-panel',
    template: annotationEditTemplate,
    events: {
        'submit': 'onSaveClicked',
        'click .btn-cancel': 'onCancelClicked',
        'click .panel-footer button.is-danger': 'onDelete',
        'click .btn-rel-items': 'onRelatedItemsClicked',
        'click .item-picker-container .field:last button': 'createItem',
    },
});
