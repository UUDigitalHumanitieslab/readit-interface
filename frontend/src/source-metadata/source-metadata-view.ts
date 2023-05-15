import { find, extend } from 'lodash';
import { ViewOptions as BaseOpt } from 'backbone';
import * as i18next from 'i18next';

import { rdfs, sourceOntology as sourceNS, sourceOntologyPrefix } from '../common-rdf/ns';
import ldChannel from '../common-rdf/radio';
import { getLabel, getLabelFromId } from '../utilities/linked-data-utilities';
import FilteredCollection from "../common-adapters/filtered-collection";
import Graph from "../common-rdf/graph";
import { CompositeView } from "../core/view";
import Select2PickerView from "../forms/select2-picker-view";
import DateField from "./date-field-view";

import sourceMetadataTemplate from './source-metadata-template';

const sourceTypePrefix = sourceNS('TF');
const isSourceType = t => t.startsWith(sourceTypePrefix);

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

    initialize(options: MetaDataOptions = {}): void {
        this.getOntology();
        if (options.readonly !== false) this.toggle();
        this.upload = options.upload !== undefined ? options.upload : false;
        this.listenTo(this.model, "change", this.render);
    }

    toggle(): this {
        this.$el.toggleClass('is-static');
        this.readonly = !this.readonly;
        return this;
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    afterRender(): this {
        // Assign names to select2 pickers to ensure form contains their data
        this.$(".sourceTypeSelect select").attr({ name: "sourceType" });
        this.renderValues();
        return this;
    }

    isSourceType(node): boolean {
        if (!node.has(rdfs.subClassOf)) {
            return false;
        }
        return (
            (node.has(rdfs.subClassOf, {
                "@id": sourceNS("ReaditSourceType"),
            }) &&
                !(node.id == sourceNS("TFO_TextForm"))) ||
            node.has(rdfs.subClassOf, { "@id": sourceNS("TFO_TextForm") })
        );
    }

    async getOntology() {
        this.ontologyGraph = await ldChannel.request("source-ontology:promise");
        this.setTypeOptions();
        this.initDateFields();
    }

    setTypeOptions(): void {
        const sourceTypes = new FilteredCollection(
            this.ontologyGraph,
            this.isSourceType
        ) as unknown as Graph;
        this.sourceTypePicker = new Select2PickerView({
            collection: sourceTypes,
        });
    }

    initDateFields() {
        this.publicationDateField = new DateField({
            model: this.getNode("datePublished"),
            name: "datePublished",
            required: true,
            label: i18next.t("label.publication-date", "Publication date"),
            additionalHelpText: `
                ${i18next.t("upload.publication-date-help.begin", " ")}<a
                    href="https://en.wikipedia.org/wiki/ISO_8601"
                    target="_blank"
                >${i18next.t(
                    "upload.publication-date-help.link",
                    "ISO formatted date with optional time and timezone"
                )}</a>${i18next.t(
                "upload.publication-date-help.end",
                ", or free-form text"
            )}
            `,
            readonly: this.readonly,
        });
        this.creationDateField = new DateField({
            model: this.getNode("dateCreated"),
            name: "dateCreated",
            label: i18next.t(
                "label.creation-date",
                "Creation date"
            ),
            additionalHelpText: i18next.t(
                "upload.creation-date-help",
                "If known and different from publishing date, specify creation date."
            ),
            readonly: this.readonly,
        });
        this.retrievalDateField = new DateField({
            model: this.getNode("dateRetrieved"),
            name: "dateRetrieved",
            label: i18next.t(
                "label.retrieval-date",
                "Retrieval date"
            ),
            additionalHelpText: i18next.t(
                "upload.retrieval-date-help",
                "Date (and optional time) at which the source was accessed or retrieved."
            ),
            readonly: this.readonly,
        });
        this.render();
    }

    getNode(predicate: string) {
        return this.ontologyGraph.get(sourceOntologyPrefix + predicate);
    }

    renderValues(): this {
        if (!this.model) return this;
        for (let attribute in this.model.attributes) {
            const values = this.model.get(attribute);
            let attributeLabel, value, valueId;
            if (!values.length) continue;
            if (attribute.startsWith(sourceOntologyPrefix)) {
                attributeLabel = getLabelFromId(attribute) as string;
                value = values[0];
            } else if (attribute === '@type') {
                attributeLabel = 'sourceType';
                value = find(values, isSourceType);
                if (!value) continue;
                valueId = value;
            } else continue;
            const queryString = `[name="${attributeLabel}"]`;
            const element = this.$(queryString);
            if (!element.length) continue;
            if (externalAttributes.includes(attributeLabel)) {
                valueId = valueId || value.id;
                const nodeFromUri = ldChannel.request("obtain", valueId);
                value = typeof nodeFromUri === "string"
                        ? nodeFromUri
                        : getLabel(nodeFromUri);
            }
            if (value instanceof Date) value = value.toISOString();
            element.val(value);
        }
        return this;
    }

    getModelValue(attribute: string) {
        const node = this.model.get(sourceNS(attribute));
        if (node) {
            return node[0];
        } else return "";
    }

    updateModel(event) {
        const changedField = event.target.name;
        const value = this.$(`[name='` + `${changedField}` + `']`).val();
        const existingValue = this.model.get(sourceNS(changedField));
        if (existingValue !== [value]) {
            this.trigger("valueChanged", changedField, value);
        }
    }
}
extend(SourceMetadataView.prototype, {
    className: 'section source',
    template: sourceMetadataTemplate,
    subviews: [
        { view: 'sourceTypePicker', selector: '.sourceTypeSelect' },
        { view: 'publicationDateField', selector: '.dates', method: 'prepend'},
        { view: 'creationDateField', selector: '.dates', method: 'append'},
        { view: 'retrievalDateField', selector: '.dates', method: 'append'},
    ],
    events: {
        'change .input': 'updateModel'
    }
})
