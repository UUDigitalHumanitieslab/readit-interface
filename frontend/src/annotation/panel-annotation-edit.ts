import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';

import { oa } from '../jsonld/ns';
import Node from '../jsonld/node';
import Graph from '../jsonld/graph';
import ldChannel from '../jsonld/radio';

import OntologyClassPickerView from '../utilities/ontology-class-picker/ontology-class-picker-view';
import ItemMetadataView from '../utilities/item-metadata/item-metadata-view';
import SnippetView from '../utilities/snippet-view/snippet-view';
import { isType } from '../utilities/utilities';
import { getOntologyInstance } from '../utilities/annotation-utilities';

import BaseAnnotationView from './base-annotation-view';

import annotationEditTemplate from './panel-annotation-edit-template';


export interface ViewOptions extends BaseOpt<Node> {
    /**
     * An instance of oa:Annotation that links to a oa:TextQuoteSelector.
     */
    model: Node;
    ontology: Graph;

}

export default class AnnotationEditView extends BaseAnnotationView {
    ontology: Graph;
    preselection: Node;
    metadataView: ItemMetadataView;
    ontologyClassPicker: OntologyClassPickerView;
    snippetView: SnippetView;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.ontology = options.ontology;
        this.listenTo(this, 'textQuoteSelector', this.processTextQuoteSelector);
        this.processModel(options.model);
        this.listenTo(this.model, 'change', this.processModel);
        return this;
    }

    processModel(node: Node): this {
        this.baseProcessModel(node);

        if (isType(node, oa.Annotation)) {
            this.metadataView = new ItemMetadataView({ model: this.model });
            this.metadataView.render();

            let ontologyInstance = getOntologyInstance(this.model, this.ontology);
            this.preselection = ldChannel.request('obtain', ontologyInstance.get('@type')[0] as string);

            this.ontologyClassPicker = new OntologyClassPickerView({
                collection: this.ontology,
                preselection: this.preselection
            });

            this.ontologyClassPicker.render();
            this.ontologyClassPicker.on('select', this.onOntologyItemSelected, this);
        }

        return this;
    }

    processTextQuoteSelector(selector: Node): this {
        if (this.snippetView) return;
            this.snippetView = new SnippetView({
                selector: selector
            });
        this.snippetView.render();
        return this;
    }

    render(): this {
        this.ontologyClassPicker.$el.detach();
        this.snippetView.$el.detach();
        if (this.metadataView) this.metadataView.$el.detach();

        this.$el.html(this.template(this));

        this.$('.ontology-class-picker-container').append(this.ontologyClassPicker.el);
        this.$('.snippet-container').append(this.snippetView.el);
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

    select(item: Node): this {
        this.$('.hidden-input').val(item.id).valid();
        return this;
    }

    onInsertedIntoDOM(): this {
        if (this.preselection) this.select(this.preselection);

        this.$(".anno-edit-form").submit(function (e) { e.preventDefault(); })
        this.$(".anno-edit-form").validate({
            errorClass: "help is-danger",
            ignore: "",
        });

        return this;
    }

    onOntologyItemSelected(item: Node): this {
        this.select(item);
        this.snippetView.selector = item;
        // TODO: remove the earlier one?
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
        'click .btn-save': 'onSaveClicked',
        'click .btn-cancel': 'onCancelClicked',
        'click .btn-rel-items': 'onRelatedItemsClicked',
        'DOMNodeInsertedIntoDocument': 'onInsertedIntoDOM',
    }
});
