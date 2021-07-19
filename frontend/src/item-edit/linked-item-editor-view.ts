import { extend } from 'lodash';

import Model from '../core/model';
import { CompositeView } from '../core/view';
import ldChannel from '../common-rdf/radio';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';
import PickerView from '../forms/base-picker-view';
import RangePicker from '../forms/range-picker-view';
import RemoveButton from '../forms/remove-button-view';
import linkedItemTemplate from './linked-item-editor-template';
import InputField from '../forms/input-field-view';

// Selector of the control where the object picker is inserted.
const objectControl = '.control:nth-child(2)';

export default class LinkedItemEditor extends CompositeView {
    collection: Graph;
    predicatePicker: PickerView;
    removeButton: RemoveButton;
    literalField: InputField;

    initialize() {
        this.predicatePicker = new PickerView({ collection: this.collection });
        this.literalField = new InputField();
        this.removeButton = new RemoveButton().on('click', this.close, this);
        if (this.model && this.model.get('required')) {
            this.removeButton.disable();
            this.predicatePicker.$('select').attr('disabled', 'true');
        }
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

    close(): void {
        this.trigger('remove', this, this.model);
    }
}

extend(LinkedItemEditor.prototype, {
    className: 'field has-addons rit-linked-items-editor',
    template: linkedItemTemplate,
    subviews: [{
        view: 'predicatePicker',
        selector: '.control:first-child',
    }, {
        view: 'literalField',
        selector: objectControl,
    }, 'removeButton'],
});
