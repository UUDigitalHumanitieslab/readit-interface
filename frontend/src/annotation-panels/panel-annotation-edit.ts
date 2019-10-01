import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from '../core/view';

import { oa } from '../jsonld/ns';
import Node from '../jsonld/node';
import Graph from '../jsonld/graph';
import { getOntologyClass } from '../utilities/annotation-utilities';

import annotationEditTemplate from './panel-annotation-edit-template';
import OntologyClassPickerView from '../utilities/ontology-class-picker/ontology-class-picker-view';
import ItemMetadataView from '../utilities/item-metadata/item-metadata-view';


export interface ViewOptions extends BaseOpt<Node> {
    model?: Node;
    ontology: Graph;
    /**
     * The text of the annotation.
     */
    text: string;
}

export default class AnnotationEditView extends View<Node> {
    ontology: Graph;
    metadataView: ItemMetadataView;
    ontologyClassPicker: OntologyClassPickerView;
    text: string;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.ontology = options.ontology;
        this.text = options.text;

        if (options.model) {
            this.metadataView = new ItemMetadataView({ model: this.model });
            this.metadataView.render();
            let preselection: Node = getOntologyClass(this.model, this.ontology);
            this.ontologyClassPicker = new OntologyClassPickerView({
                collection: this.ontology,
                preselection: preselection
            });
        }
        else {
            this.model = new Node();
            this.ontologyClassPicker = new OntologyClassPickerView({
                collection: this.ontology
            });
        }

        this.ontologyClassPicker.render();
        this.ontologyClassPicker.on('select', this.onOntologyItemSelected, this);
        return this;
    }

    render(): this {
        this.ontologyClassPicker.$el.detach();
        if (this.metadataView) this.metadataView.$el.detach();

        this.$el.html(this.template(this));

        this.$(".anno-edit-form").submit(function(e) { e.preventDefault(); })
        this.$(".anno-edit-form").validate({
            errorClass: "help is-danger",
            ignore: "",
        });

        this.$('.ontology-class-picker-container').append(this.ontologyClassPicker.el);
        if (this.metadataView) this.$('.metadata-container').append(this.metadataView.el);
        return this;
    }

    submit(): this {
        this.model.save();
        this.trigger('submit');
        return this;
    }

    reset(): this {
        this.model.previousAttributes();
        // this.ontologyClassPicker.render();
        this.trigger('reset');
        return this;
    }

    onOntologyItemSelected(item: Node): this {
        this.$('.hidden-input').val(item.id).valid();
        this.model.set(oa.hasBody, item);
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
        this.trigger('close')
        return this;
    }
}
extend(AnnotationEditView.prototype, {
    tagName: 'div',
    className: 'annotation-edit-panel explorer-panel',
    template: annotationEditTemplate,
    events: {
        'click .btn-save': 'onSaveClicked',
        'click .btn-cancel': 'onCancelClicked',
    }
});
