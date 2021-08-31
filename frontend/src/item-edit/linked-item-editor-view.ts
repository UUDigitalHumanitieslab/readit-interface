import {
    find, intersection, extend, chain, isNumber, isBoolean, isString, isDate,
} from 'lodash';

import Model from '../core/model';
import { CompositeView } from '../core/view';
import { asLD, Native } from '../common-rdf/conversion';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';
import { rdfs, xsd } from '../common-rdf/ns';
import { NativeArray } from '../common-rdf/conversion';
import Select2Picker from '../forms/select2-picker-view';
import RemoveButton from '../forms/remove-button-view';
import InputField from '../forms/input-field-view';
import { getRdfSuperProperties } from '../utilities/linked-data-utilities';
import interpretText from '../utilities/interpret-text';

import AllowedTypesListHelpText from './allowed-type-list-view';
import DetectedTypeHelpText from './detected-type-help-view';
import linkedItemTemplate from './linked-item-editor-template';

// Selector of the control where the object picker is inserted.
const objectControl = '.field.has-addons .control:nth-child(2)';
// Selector of template element displaying "all types allowed" help text.
const allTypesAllowedHelp = 'p.help:first-of-type';

const semiCompatibleTypes: [(v: any) => boolean, string[]][] = [
    [isBoolean, [xsd.boolean]],
    [isNumber, [
        xsd.double, xsd.float, xsd.byte, xsd.unsignedByte, xsd.short,
        xsd.unsignedShort, xsd.int, xsd.unsignedInt, xsd.long,
        xsd.unsignedLong, xsd.integer, xsd.nonNegativeInteger,
        xsd.nonPositiveInteger, xsd.positiveInteger, xsd.negativeInteger,
        xsd.decimal,
    ]],
    [isDate, [xsd.dateTime, xsd.date]],
    [isString, [
        xsd.string, xsd.normalizedString, xsd.token, xsd.language,
        xsd.base64Binary,
    ]],
];

function findType(range: Graph, value: any): string {
    if (range.length === 1) return range.at(0).id;
    const matches = find(semiCompatibleTypes, ([check]) => check(value))[1];
    const available = range.map(n => n.id);
    return intersection(matches, available)[0];
}

export default class LinkedItemEditor extends CompositeView {
    collection: Graph;
    range: Graph;
    predicatePicker: Select2Picker;
    removeButton: RemoveButton;
    literalField: InputField;
    allowedTypesList: AllowedTypesListHelpText;
    detectedTypeHelp: DetectedTypeHelpText;

    initialize() {
        this.range = new Graph;
        this.predicatePicker = new Select2Picker({collection: this.collection});
        this.literalField = new InputField();
        this.removeButton = new RemoveButton().on('click', this.close, this);
        this.allowedTypesList = new AllowedTypesListHelpText({
            collection: this.range,
        });
        this.detectedTypeHelp = new DetectedTypeHelpText({ model: new Model });
        this.render().updateRange();
        this.predicateFromModel(this.model).objectFromModel(this.model);
        this.literalField.on('keyup', this.updateObject, this);
        this.predicatePicker.on('change', this.updatePredicate, this);
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    updatePredicate(picker: Select2Picker, id: string): void {
        const predicate = this.collection.get(id);
        this.model.set('predicate', predicate);
        this.model.unset('object');
        this.updateRange();
    }

    updateRange(): this {
        const predicate = this.model.get('predicate');
        this.$(allTypesAllowedHelp).hide();
        this.allowedTypesList.$el.hide();
        if (!predicate) {
            this.range.reset();
            return this;
        }
        const allProperties = getRdfSuperProperties([predicate]);
        this.range.set(
            chain(allProperties)
            .map(n => n.get(rdfs.range) as Node[])
            .flatten()
            .compact()
            .value()
        );
        if (!this.range.length || this.range.get(rdfs.Literal)) {
            this.$(allTypesAllowedHelp).show();
        } else {
            this.allowedTypesList.$el.show();
        }
        return this;
    }

    updateObject(labelField: InputField, val: string): void {
        const interpretation = interpretText(val, this.range);
        if (interpretation) {
            this.detectedTypeHelp.model.set(interpretation);
            this.detectedTypeHelp.$el.show();
            this.model.set('object', interpretation.jsonld);
        } else {
            this.detectedTypeHelp.$el.hide();
        }
    }

    predicateFromModel(model: Model, selectedPredicate?: Node): this {
        selectedPredicate || (selectedPredicate = model.get('predicate'));
        if (!selectedPredicate) return this;
        this.predicatePicker.val(selectedPredicate.id);
        return this;
    }

    objectFromModel(model: Model, setLiteral?: Native): this {
        setLiteral || (setLiteral = model.get('object'));
        if (setLiteral) {
            const jsonld = asLD(setLiteral);
            this.literalField.setValue(jsonld['@value']);
            if (!jsonld['@type']) {
                jsonld['@type'] = findType(this.range, jsonld['@value']);
            }
            this.detectedTypeHelp.model.set({ jsonld });
        } else {
            this.detectedTypeHelp.$el.hide();
        }
        return this;
    }

    close(): void {
        this.trigger('remove', this, this.model);
    }
}

extend(LinkedItemEditor.prototype, {
    className: 'field rit-linked-items-editor',
    template: linkedItemTemplate,
    subviews: [{
        view: 'predicatePicker',
        selector: '.field.has-addons .control:first-child',
    }, {
        view: 'literalField',
        selector: objectControl,
    }, {
        view: 'removeButton',
        selector: '.field.has-addons',
    }, 'allowedTypesList', 'detectedTypeHelp'],
});
