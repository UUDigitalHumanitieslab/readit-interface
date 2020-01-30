import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';

import { oa, rdf } from '../jsonld/ns';
import Node from '../jsonld/node';
import Graph from '../jsonld/graph';

import PickerView from '../forms/base-picker-view';
import ItemGraph from '../utilities/item-graph';
import OntologyClassPickerView from '../utilities/ontology-class-picker/ontology-class-picker-view';
import ItemMetadataView from '../utilities/item-metadata/item-metadata-view';
import SnippetView from '../utilities/snippet-view/snippet-view';
import { isType } from '../utilities/utilities';
import { AnnotationPositionDetails } from '../utilities/annotation/annotation-utilities';
import { composeAnnotation, getAnonymousTextQuoteSelector } from './../utilities/annotation/annotation-creation-utilities';

import BaseAnnotationView from './base-annotation-view';

import annotationEditTemplate from './panel-annotation-edit-template';


export interface ViewOptions extends BaseOpt<Node> {
    /**
     * An instance of oa:Annotation that links to a oa:TextQuoteSelector,
     * can be undefined if range and positionDetails are set (i.e. in case of a new annotation)
     */
    model: Node;
    ontology: Graph;

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
    ontology: Graph;
    source: Node;
    range: Range;
    positionDetails: AnnotationPositionDetails;
    preselection: Node;
    metadataView: ItemMetadataView;
    classPicker: ClassPickerView;
    snippetView: SnippetView;
    modelIsAnnotion: boolean;
    selectedClass: Node;
    itemPicker: PickerView;
    itemOptions: ItemGraph;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.ontology = options.ontology;
        this.itemOptions = new ItemGraph();
        this.itemPicker = new PickerView({collection: this.itemOptions});

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
            collection: this.ontology,
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
        return this;
    }

    remove() {
        this.metadataView && this.metadataView.remove();
        this.classPicker && this.classPicker.remove();
        this.snippetView && this.snippetView.remove();
        this.itemPicker.remove();
        return super.remove();
    }

    submit(): this {
        if (this.model.isNew()) {
            composeAnnotation(
                this.source,
                this.positionDetails,
                this.selectedClass,
                this.snippetView.selector,
                (error, results) => {
                    if (error) return console.debug(error);
                    this.trigger('annotationEditView:saveNew', this, results.annotation, results.items);
                });
        }
        else {
            let existingBodyClass = this.model.get(oa.hasBody);
            if (existingBodyClass) this.model.unset(oa.hasBody, existingBodyClass);
            this.model.set(oa.hasBody, (this.selectedClass));
            this.model.save();
            this.trigger('annotationEditView:save', this, this.model);
        }
        return this;
    }

    reset(): this {
        this.trigger('reset');
        return this;
    }

    selectClass(cls: Node): this {
        this.$('.hidden-input').val(cls.id).valid();
        this.selectedClass = cls;
        this.itemOptions.query({ predicate: rdf.type, object: cls.id });
        this.$('.item-picker-container').removeClass('is-hidden');
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
    }
});
