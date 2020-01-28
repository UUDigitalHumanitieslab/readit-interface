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
    ontologyClassPicker: OntologyClassPickerView;
    snippetView: SnippetView;
    modelIsAnnotion: boolean;
    selectedOntologyClass: Node;
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
            this.listenTo(this, 'body:ontologyClass', this.processOntologyClass)
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
            this.initOntologyClassPicker();
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

        if (!this.modelIsAnnotion) this.initOntologyClassPicker();
        return this;
    }

    processOntologyClass(ontologyClass: Node): this {
        this.preselection = ontologyClass;
        return this;
    }

    initOntologyClassPicker(): this {
        this.ontologyClassPicker = new OntologyClassPickerView({
            collection: this.ontology,
            preselection: this.preselection
        });

        this.ontologyClassPicker.render();
        this.listenTo(this.ontologyClassPicker, 'select', this.onOntologyItemSelected);
        return this;
    }

    render(): this {
        this.ontologyClassPicker.$el.detach();
        this.itemPicker.$el.detach();
        if (this.snippetView) this.snippetView.$el.detach();
        if (this.metadataView) this.metadataView.$el.detach();

        this.$el.html(this.template(this));
        if (this.preselection) this.select(this.preselection);

        this.$(".anno-edit-form").validate({
            errorClass: "help is-danger",
            ignore: "",
        });

        this.$('.ontology-class-picker-container').append(this.ontologyClassPicker.el);
        this.$('.item-picker-container .field:first .control')
            .append(this.itemPicker.el);
        if (this.snippetView) this.$('.snippet-container').append(this.snippetView.el);
        if (this.metadataView) this.$('.metadata-container').append(this.metadataView.el);
        return this;
    }

    submit(): this {
        if (this.model.isNew()) {
            composeAnnotation(
                this.source,
                this.positionDetails,
                this.selectedOntologyClass,
                this.snippetView.selector,
                (error, results) => {
                    if (error) return console.debug(error);
                    this.trigger('annotationEditView:saveNew', this, results.annotation, results.items);
                });
        }
        else {
            let existingBodyOntologyClass = this.model.get(oa.hasBody);
            if (existingBodyOntologyClass) this.model.unset(oa.hasBody, existingBodyOntologyClass);
            this.model.set(oa.hasBody, (this.selectedOntologyClass));
            this.model.save();
            this.trigger('annotationEditView:save', this, this.model);
        }
        return this;
    }

    reset(): this {
        this.trigger('reset');
        return this;
    }

    select(item: Node): this {
        this.$('.hidden-input').val(item.id).valid();
        this.selectedOntologyClass = item;
        this.itemOptions.query({ predicate: rdf.type, object: item.id });
        this.$('.item-picker-container').removeClass('is-hidden');
        this.itemPicker.$el.addClass('is-loading');
        this.itemOptions.once(
            'update error',
            () => this.itemPicker.$el.removeClass('is-loading')
        );
        return this;
    }

    onOntologyItemSelected(item: Node): this {
        this.select(item);
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
        this.trigger('add-related-item', this.ontologyClassPicker.getSelected());
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
