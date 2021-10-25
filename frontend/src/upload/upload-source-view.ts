import { extend } from 'lodash';
import FilteredCollection from '../common-adapters/filtered-collection';
import Graph from '../common-rdf/graph';
import Node from '../common-rdf/node';
import { rdfs, sourceOntology as sourceNS, sourceOntologyPrefix } from '../common-rdf/ns';
import ldChannel from '../common-rdf/radio';
import { CompositeView } from '../core/view';
import Select2Picker from '../forms/select2-picker-view';
import DateField from './date-field-view';
import uploadSourceTemplate from './upload-source-template';


export default class UploadSourceFormView extends CompositeView {
    isSuccess: boolean;
    hasError: boolean;
    sourceText: string;

    sourceTypePicker: Select2Picker;

    sourceTypes: Graph;
    ontologyGraph: Graph;

    /**
     * Class to add to invalid inputs. Note that this is not
     * the same as the class added to the validate method by default:
     * that is for labels and includes the class 'help' as well.
     * These two are separated to integrate smoothly with Bulma.
     */
    errorClassInputs: string = "is-danger";

    publicationDateField: DateField;
    creationDateField: DateField;
    retrievalDateField: DateField;

    initialize(): this {
        let self = this;
        this.getOntology();

        this.$el.validate({
            errorClass: "help is-danger",
            rules: {
                source: { required: true, extension: "txt" },
                language: { required: true },
                type: { required: true },
                publicationdate: { required: true },
                url: { url: true },
                public: { required: true }
            },
            errorPlacement: function (error, element) {
                let parent = element.parent();
                if (parent.hasClass('has-helptext')) {
                    let field = element.closest('.field');
                    error.insertBefore(field.children().last());
                }
                else {
                    error.appendTo(parent);
                }
            },
            highlight: function (element, errorClass) {
                let elem = $(element);
                let parent = elem.parent();
                if (parent.hasClass('select')) parent.addClass(self.errorClassInputs);
                else elem.addClass(self.errorClassInputs);
            },
            unhighlight: function (element, errorClass) {
                let elem = $(element);
                let parent = elem.parent();
                if (parent.hasClass('select')) parent.removeClass(self.errorClassInputs);
                else elem.removeClass(self.errorClassInputs);
            }
        });

        return this;
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        this.hideFeedback();
        let input = this.$('.file-input');
        let label = this.$('.filelabel');
        let name = this.$('.filename');

        this.$('.btn-preview').prop('disabled', true);

        input.on('change', () => {
            let files = (input.get(0) as HTMLInputElement).files;
            if (files.length === 0) {
                name.text('No file selected');
            } else {
                name.text(files[0].name);
                label.text('Change file...');
                this.$('.btn-preview').prop('disabled', false);
            }
            input.valid();
        });

        return this;
    }

    afterRender(): this {
        // Assign names to select2 pickers to ensure form contains their data
        this.$('#sourceTypeSelect select').attr({ 'name': 'type' });
        return this;
    }

    /**
     * Dynamically set the height for the view, based on the viewport height.
     */
    setHeight(height: number): void {
        this.$el.css('height', height);
    }

    onSaveClicked(event: JQueryEventObject): this {
        event.preventDefault();
        var self = this;
        if (this.$el.valid()) {
            let n = new Node();
            n.save(this.$el.get(0), { url: "/source/add/" });
            n.once('sync', () => {
                self.handleUploadSuccess();
            });
            n.once('error', () => {
                this.$('.form-feedback-bar.has-background-danger').show();
            });
        }
        return this;
    }

    reset(): this {
        this.$el.trigger('reset');
        return this;
    }

    handleUploadSuccess(): this {
        this.reset();
        this.$('.form-feedback-bar.has-background-success').show();
        return this;
    }

    onCancelClicked(event: JQueryEventObject): this {
        event.preventDefault();
        window.history.back();
        return this;
    }

    onPreviewClicked(): this {
        let file = (this.$('.file-input').get(0) as HTMLInputElement).files[0];
        let reader = new FileReader();
        reader.onload = (f) => {
            const sourceText = this.escapeHtml(f.target.result as string);
            this.$('pre').append(sourceText);
            this.$('.modal').addClass('is-active');
        };
        reader.readAsText(file);
        return this;
    }

    hidePreview(event?: JQueryEventObject): this {
        this.$('pre').empty();
        this.$('.modal').removeClass('is-active');
        return this;
    }

    hideFeedback(event?: JQueryEventObject): this {
        this.$('.form-feedback-bar').hide();
        return this;
    }

    escapeHtml(input: string): string {
        return new Option(input).innerHTML;
    }

    // Valid source types are subClassOf TFO_TextForm, subClassOf ReaditSourceType
    // but not TFO_TextForm itself 
    isSourceType(node): boolean {
        if (!node.has(rdfs.subClassOf)) {
            return false;
        }
        return ((node.get(rdfs.subClassOf)[0].id == sourceNS('ReaditSourceType')) &&
            !(node.id == sourceNS('TFO_TextForm'))) ||
            node.get(rdfs.subClassOf)[0].id == sourceNS('TFO_TextForm');
    }

    getOntology() {
        this.ontologyGraph = ldChannel.request('source-ontology:graph');
        this.listenToOnce(this.ontologyGraph, 'sync', () => {
            this.setTypeOptions();
            this.initHelpTexts();
        });
    }

    setTypeOptions(): void {
        const sourceTypes = new FilteredCollection<Node>(this.ontologyGraph, this.isSourceType) as unknown as Graph;
        this.sourceTypePicker = new Select2Picker({ collection: sourceTypes });
    }

    initHelpTexts() {
        this.publicationDateField = new DateField({
            model: {
                node: this.getNode('datePublished'),
                name: 'publicationdate',
                required: true,
                label: 'Publication date',
                additionalHelpText: `<a href="https://en.wikipedia.org/wiki/ISO_8601" target="_blank">ISO formatted
                date with optional time and timezone</a>, or free-form text`}
            });
        this.creationDateField = new DateField({
            model: {
                node: this.getNode('dateCreated'),
                name: 'creationdate',
                required: false,
                label: 'Creation date (optional)',
                additionalHelpText: 'If known and different from publishing date, specify creation date.'}
            });
        this.retrievalDateField = new DateField({
            model: {
                node: this.getNode('dateRetrieved'),
                name: 'retrievaldate',
                required: false,
                label: 'Retrieval date (optional)',
                additionalHelpText: 'Date (and optional time) at which the source was accessed or retrieved.'}
            });
        this.render();
    }

    getNode(predicate: string) {
        return this.ontologyGraph.get(sourceOntologyPrefix + predicate);
    }

}
extend(UploadSourceFormView.prototype, {
    tagName: 'form',
    className: 'section upload-source-form page',
    template: uploadSourceTemplate,
    subviews: [
        { view: 'sourceTypePicker', selector: '#sourceTypeSelect' },
        { view: 'publicationDateField', selector: '.dates', method: 'prepend'},
        { view: 'creationDateField', selector: '.dates', method: 'append'},
        { view: 'retrievalDateField', selector: '.dates', method: 'append'},
    ],
    events: {
        'submit': 'onSaveClicked',
        'click .btn-cancel': 'onCancelClicked',
        'click .input': 'hideFeedback',
        'click .btn-preview': 'onPreviewClicked',
        'click .modal-background': 'hidePreview',
        'click .delete': 'hidePreview',
        'keyup .with-help': 'updateHelpText',
    }
});
