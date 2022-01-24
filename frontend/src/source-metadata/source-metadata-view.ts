import { extend } from 'lodash';
import { ViewOptions as BaseOpt } from 'backbone';

import { rdfs, sourceOntology as sourceNS, sourceOntologyPrefix } from '../common-rdf/ns';
import ldChannel from '../common-rdf/radio';
import { getLabel, getLabelFromId } from '../utilities/linked-data-utilities';
import FilteredCollection from "../common-adapters/filtered-collection";
import Graph from "../common-rdf/graph";
import { CompositeView } from "../core/view";
import Select2PickerView from "../forms/select2-picker-view";
import DateField from "./date-field-view";

import sourceMetadataTemplate from './source-metadata-template';


const externalAttributes = [
    'language',
    'sourceType',
    'creator'
];

interface MetaDataOptions extends BaseOpt {
    readonly? : boolean;
    upload?: boolean;
}

export default class SourceMetadataView extends CompositeView {
    readonly: boolean;
    upload: boolean;

    sourceTypePicker: Select2PickerView;

    sourceTypes: Graph;
    ontologyGraph: Graph;

    publicationDateField: DateField;
    creationDateField: DateField;
    retrievalDateField: DateField;

    initialize(options: MetaDataOptions): this {
        this.getOntology();
        this.readonly = options.readonly !== undefined? options.readonly : true;
        this.upload = options.upload !== undefined? options.upload : false;
        this.listenTo(this.model, 'change', this.render);
        return this;
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    afterRender(): this {
        // Assign names to select2 pickers to ensure form contains their data
        this.$('#sourceTypeSelect select').attr({ 'name': 'sourceType' });
        this.renderValues();
        return this;
    }

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
            this.initDateFields();
        });
    }

    setTypeOptions(): void {
        const sourceTypes = new FilteredCollection(this.ontologyGraph, this.isSourceType) as unknown as Graph;
        this.sourceTypePicker = new Select2PickerView({ collection: sourceTypes });
    }

    initDateFields() {
        this.publicationDateField = new DateField({
            model: this.getNode('datePublished'),
            name: 'datePublished',
            required: true,
            label: 'Publication date',
            additionalHelpText: `<a href="https://en.wikipedia.org/wiki/ISO_8601" target="_blank">ISO formatted
                date with optional time and timezone</a>, or free-form text`,
            readonly: this.readonly
        });
        this.creationDateField = new DateField({
            model: this.getNode('dateCreated'),
            name: 'dateCreated',
            label: 'Creation date (optional)',
            additionalHelpText: 'If known and different from publishing date, specify creation date.',
            readonly: this.readonly      
        });
        this.retrievalDateField = new DateField({
            model: this.getNode('dateRetrieved'),
            name: 'dateRetrieved',
            label: 'Retrieval date (optional)',
            additionalHelpText: 'Date (and optional time) at which the source was accessed or retrieved.',
            readonly: this.readonly
        });
        this.render();
    }

    getNode(predicate: string) {
        return this.ontologyGraph.get(sourceOntologyPrefix + predicate);
    }

    renderValues(): this {
        if (!this.model) return;
        for (let attribute in this.model.attributes) {
            if (attribute.startsWith(sourceOntologyPrefix)) {
                const attributeLabel = getLabelFromId(attribute);
                const queryString = `[name='` + `${attributeLabel}` + `']`
                const element = this.$(queryString);
                if (element.length) {
                    let value = this.model.get(attribute)[0];
                    if (externalAttributes.includes(attributeLabel)) {
                        const nodeFromUri = ldChannel.request('obtain', value.id);
                        value = typeof nodeFromUri === 'string'? nodeFromUri : getLabel(nodeFromUri);
                    }
                    element.val(value);
                }
            }
        }
        return this;
    }

    getModelValue(attribute: string) {
        const node = this.model.get(sourceNS(attribute));
        if (node) {
            return node[0];
        }
        else return '';
    }

    updateModel(event){
        const changedField = event.target.name;
        const value = this.$(`[name='` + `${changedField}` + `']`).val();
        const existingValue = this.model.get(sourceNS(changedField));
        if (existingValue !== [value]) {
            this.trigger('valueChanged', changedField, value);   
        }
    }
}
extend(SourceMetadataView.prototype, {
    template: sourceMetadataTemplate,
    subviews: [
        { view: 'sourceTypePicker', selector: '#sourceTypeSelect' },
        { view: 'publicationDateField', selector: '.dates', method: 'prepend'},
        { view: 'creationDateField', selector: '.dates', method: 'append'},
        { view: 'retrievalDateField', selector: '.dates', method: 'append'},
    ],
    events: {
        'change .input': 'updateModel'
    }
})