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
        this.predicatePicker.on('change', this.updatePredicate, this);
        if (!this.model) this.model = new Model();
        // this.predicateFromModel(this.model).objectFromModel(this.model);
        this.removeButton = new RemoveButton().on('click', this.close, this);
        this.literalField = new InputField().on('change', this.updateObject, this);
        this.render();
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    updatePredicate(picker: PickerView, id: string): void {
        const predicate = this.collection.get(id);
        this.model.set('predicate', predicate);
        if (this.model.has('object')) this.model.unset('object');
    }

    updateObject(labelField: InputField, val: string): void {
        this.model.set('object', val);
    }

    createPicker(predicate: Node): RangePicker {
        return ldChannel.request('visit', store => new RangePicker({
            model: predicate,
            collection: store,
        }));
    }

    predicateFromModel(model: Model, selectedPredicate?: Node): this {
        selectedPredicate || (selectedPredicate = model.get('predicate'));
        if (!selectedPredicate) return this;
        this.predicatePicker.val(selectedPredicate.id);
        return this;
    }

    objectFromModel(model: Model, setLiteral: string): this {
        setLiteral || (setLiteral = model.get('object'));
        return this;
    }

    close(): void {
        this.trigger('remove', this, this.model);
    }
}

extend(LinkedItemEditor.prototype, {
    className: 'field has-addons rit-relation-editor',
    template: linkedItemTemplate,
    subviews: [{
        view: 'predicatePicker',
        selector: '.control:first-child',
    }, {
        view: 'literalField',
        selector: objectControl,
    }, 'removeButton'],
});
