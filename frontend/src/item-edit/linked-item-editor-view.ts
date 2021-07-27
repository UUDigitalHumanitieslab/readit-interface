import { extend } from 'lodash';

import Model from '../core/model';
import { CompositeView } from '../core/view';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';
import PickerView from '../forms/base-picker-view';
import RemoveButton from '../forms/remove-button-view';
import linkedItemTemplate from './linked-item-editor-template';
import InputField from '../forms/input-field-view';
import { rdfs, xsd } from '../common-rdf/ns';
import { NativeArray } from '../common-rdf/conversion';

// Selector of the control where the object picker is inserted.
const objectControl = '.control:nth-child(2)';

export default class LinkedItemEditor extends CompositeView {
    collection: Graph;
    predicatePicker: PickerView;
    removeButton: RemoveButton;
    literalField: InputField;
    helpText: string;

    initialize() {
        this.predicatePicker = new PickerView({ collection: this.collection });
        this.literalField = new InputField();
        this.removeButton = new RemoveButton().on('click', this.close, this);
        this.predicateFromModel(this.model).objectFromModel(this.model);
        this.literalField.on('change', this.updateObject, this);
        this.predicatePicker.on('change', this.updatePredicate, this);
        this.render();
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    updatePredicate(picker: PickerView, id: string): void {
        const predicate = this.collection.get(id);
        this.model.set('predicate', predicate);
        this.model.unset('object');
        const permittedType = predicate.get(rdfs.range);
        this.setHelpText(permittedType);
        this.$('p.help').removeClass('is-hidden');
        this.render();
    }

    updateObject(labelField: InputField, val: string): void {
        this.model.set('object', val);
    }

    predicateFromModel(model: Model, selectedPredicate?: Node): this {
        selectedPredicate || (selectedPredicate = model.get('predicate'));
        if (!selectedPredicate) return this;
        this.predicatePicker.val(selectedPredicate.id);
        return this;
    }

    objectFromModel(model: Model, setLiteral?: string): this {
        setLiteral || (setLiteral = model.get('object'));
        if (!setLiteral) return this;
        this.literalField.setValue(setLiteral);
        return this;
    }

    setHelpText(permittedType: string | NativeArray): void {
        this.helpText = 'This predicate permits '
        switch (permittedType) {
            case xsd.dateTime || xsd.time:
                this.helpText += 'date / time strings';
            case xsd.decimal || xsd.integer || xsd.float || xsd.double:
                this.helpText += 'numbers';
            case xsd.string || rdfs.Literal:
                this.helpText += 'strings';
                break;
            default:
                this.helpText += 'any data type';
        }
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
        selector: '.control:first-child',
    }, {
        view: 'literalField',
        selector: objectControl,
        }, {
            view: 'removeButton',
            selector: '.field.has-addons',
            method: 'append'
        }
    ],
});
