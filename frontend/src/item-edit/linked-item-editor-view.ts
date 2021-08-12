import { extend } from 'lodash';

import Model from '../core/model';
import { CompositeView } from '../core/view';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';
import Select2Picker from '../forms/select2-picker-view';
import RemoveButton from '../forms/remove-button-view';
import linkedItemTemplate from './linked-item-editor-template';
import InputField from '../forms/input-field-view';
import { rdfs, xsd } from '../common-rdf/ns';
import { NativeArray } from '../common-rdf/conversion';

// Selector of the control where the object picker is inserted.
const objectControl = '.field.has-addons .control:nth-child(2)';

export default class LinkedItemEditor extends CompositeView {
    collection: Graph;
    predicatePicker: Select2Picker;
    removeButton: RemoveButton;
    literalField: InputField;

    initialize() {
        this.predicatePicker = new Select2Picker({collection: this.collection});
        this.literalField = new InputField();
        this.removeButton = new RemoveButton().on('click', this.close, this);
        this.predicateFromModel(this.model).objectFromModel(this.model);
        this.literalField.on('change', this.updateObject, this);
        this.predicatePicker.on('change', this.updatePredicate, this);
        this.render().updateRange();
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
        if (!predicate) {
            this.$('p.help').text('');
            return this;
        }
        const range = predicate.get(rdfs.range);
        this.model.set({ range }, { silent: true });
        this.setHelpText(range);
        return this;
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
        let helpText = 'This predicate permits '
        switch (permittedType) {
            case xsd.dateTime || xsd.time:
                helpText += 'date / time strings';
            case xsd.decimal || xsd.integer || xsd.float || xsd.double:
                helpText += 'numbers';
            case xsd.string || rdfs.Literal:
                helpText += 'strings';
                break;
            default:
                helpText += 'any data type';
        }
        this.$('p.help').text(helpText);
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
            method: 'append'
        }
    ],
});
