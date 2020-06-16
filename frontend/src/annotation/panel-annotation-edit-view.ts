import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';

import Model from '../core/model';
import { oa, rdf, skos } from '../jsonld/ns';
import ldChannel from '../jsonld/radio';
import Node from '../jsonld/node';
import Graph from '../jsonld/graph';

import ItemEditor from '../panel-ld-item/ld-item-edit-view';
import PickerView from '../forms/base-picker-view';
import FilteredCollection from '../utilities/filtered-collection';
import ItemGraph from '../utilities/item-graph';
import ClassPickerView from '../utilities/ontology-class-picker/ontology-class-picker-view';
import ItemMetadataView from '../utilities/item-metadata/item-metadata-view';
import SnippetView from '../utilities/snippet-view/snippet-view';
import { isRdfsClass, isType } from '../utilities/utilities';
import { AnnotationPositionDetails } from '../utilities/annotation/annotation-utilities';
import { composeAnnotation, getAnonymousTextQuoteSelector } from './../utilities/annotation/annotation-creation-utilities';

import BaseAnnotationView from './base-annotation-view';
import FlatCollection from './flat-annotation-collection';

import annotationEditTemplate from './panel-annotation-edit-template';

/**
 * Helper function in order to pass the right classes to the classPicker.
 */
function getOntologyClasses() {
    const ontology = ldChannel.request('ontology:graph') || new Graph();
    return new FilteredCollection<Node, Graph>(ontology, isRdfsClass);
}

export interface ViewOptions extends BaseOpt<Model> {
    /**
     * An instance of oa:Annotation that links to a oa:TextQuoteSelector,
     * can be undefined if range and positionDetails are set (i.e. in case of a new annotation)
     */
    model: Node;
    collection?: FlatCollection;

    /**
     * Should be set in case of a new annotation (i.e. when model is undefined).
     */
    range?: Range;

    /**
     * Should be set in case of a new annotation (i.e. when model is undefined).
     */
    positionDetails?: AnnotationPositionDetails;

    /**
     * Should be set in case of a new annotation (i.e. when model is undefined).
     */
    source?: Node;
}

export default class AnnotationEditView extends BaseAnnotationView {
    collection: FlatCollection;
    source: Node;
    range: Range;
    positionDetails: AnnotationPositionDetails;
    preselection: Node;
    metadataView: ItemMetadataView;
    classPicker: ClassPickerView;
    snippetView: SnippetView;
    modelIsAnnotion: boolean;
    selectedClass: Node;
    selectedItem: Node;
    itemPicker: PickerView;
    itemOptions: ItemGraph;
    itemEditor: ItemEditor;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.itemOptions = new ItemGraph();
        this.itemPicker = new PickerView({collection: this.itemOptions});
        this.itemPicker.on('change', this.selectItem, this);

        if (options.range) {
            this.source = options.source;
            this.range = options.range;
            this.positionDetails = options.positionDetails;
            this.model = getAnonymousTextQuoteSelector(this.range);
        }

        this.modelIsAnnotion = isType(this.model, oa.Annotation);

        if (this.modelIsAnnotion) {
            this.listenTo(this, 'source', this.processSource);
            this.listenTo(this, 'body:ontologyClass', this.processClass)
            this.listenTo(this, 'textQuoteSelector', this.processTextQuoteSelector);
            this.processModel(options.model);
            this.listenTo(this.model, 'change', this.processModel);
        }
        else {
            this.processTextQuoteSelector(this.model);
            this.listenTo(this.model, 'change', this.processTextQuoteSelector);
        }

        return this;
    }

    processModel(node: Node): this {
        super.processAnnotation(node);

        if (isType(node, oa.Annotation)) {
            this.metadataView = new ItemMetadataView({ model: this.model });
            this.metadataView.render();
            this.initClassPicker();
        }

        return this;
    }

    processSource(source: Node): this {
        this.source = source;
        return this;
    }

    processTextQuoteSelector(selector: Node): this {
        if (this.snippetView) return this;

        this.snippetView = new SnippetView({
            selector: selector
        });
        this.snippetView.render();

        if (!this.modelIsAnnotion) this.initClassPicker();
        return this;
    }

    processClass(cls: Node): this {
        this.preselection = cls;
        return this;
    }

    initClassPicker(): this {
        this.classPicker = new ClassPickerView({
            collection: getOntologyClasses(),
            preselection: this.preselection
        });

        this.classPicker.render();
        this.listenTo(this.classPicker, 'select', this.onClassSelected);
        return this;
    }

    render(): this {
        this.classPicker.$el.detach();
        this.itemPicker.$el.detach();
        if (this.snippetView) this.snippetView.$el.detach();
        if (this.metadataView) this.metadataView.$el.detach();
        if (this.itemEditor) this.itemEditor.$el.detach();

        this.$el.html(this.template(this));
        if (this.preselection) this.selectClass(this.preselection);

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
            this.model.unset(oa.hasBody);
            this.model.set(oa.hasBody, this.selectedClass);
            this.submitItem().then(this.submitOldAnnotation.bind(this));
        }
        return this;
    }

    submitItem(): Promise<boolean> {
        let newItem = false;
        if (!this.selectedItem) return Promise.resolve(newItem);
        if (this.selectedItem.isNew()) {
            const items = new ItemGraph();
            items.add(this.selectedItem);
            newItem = true;
        }
        return new Promise((resolve, reject) => {
            this.selectedItem.save();
            this.selectedItem.once('sync', () => resolve(newItem));
            this.selectedItem.once('error', reject);
        });
    }

    submitNewAnnotation(): void {
        composeAnnotation(
            this.source,
            this.positionDetails,
            this.snippetView.selector,
            this.selectedClass,
            this.selectedItem,
            (error, results) => {
                if (error) return console.debug(error);
                const anno = results.annotation;
                this.collection.underlying.add(anno);
                const flat = this.collection.get(anno.id);
                this.trigger('annotationEditView:saveNew', this, flat, results.items);
            }
        );
    }

    submitOldAnnotation(newItem: boolean): void {
        this.selectedItem && this.model.set(oa.hasBody, this.selectedItem);
        this.model.save();
        this.trigger('annotationEditView:save', this, this.model, newItem);
    }

    reset(): this {
        this.trigger('reset');
        return this;
    }

    selectClass(cls: Node): this {
        this.$('.hidden-input').val(cls.id).valid();
        this.selectedClass = cls;
        this.itemOptions.query({ predicate: rdf.type, object: cls.id });
        this.removeEditor();
        this.$('.item-picker-container').removeClass('is-hidden');
        return this;
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

    onClassSelected(cls: Node): this {
        this.selectClass(cls);
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
        this.trigger('annotationEditView:close', this);
        return this;
    }

    onRelatedItemsClicked(event: JQueryEventObject): this {
        this.trigger('add-related-item', this.classPicker.getSelected());
        return this;
    }
}
extend(AnnotationEditView.prototype, {
    tagName: 'div',
    className: 'annotation-edit-panel explorer-panel',
    template: annotationEditTemplate,
    events: {
        'submit': 'onSaveClicked',
        'click .btn-cancel': 'onCancelClicked',
        'click .btn-rel-items': 'onRelatedItemsClicked',
        'click .item-picker-container .field:last button': 'createItem',
    }
});
