import {
    extend, chain
} from 'lodash';

import Model from '../core/model';
import { CompositeView } from '../core/view';
import { asLD, Native } from '../common-rdf/conversion';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';
import { rdfs, xsd } from '../common-rdf/ns';
import Select2Picker from '../forms/select2-picker-view';
import RemoveButton from '../forms/remove-button-view';
import InputField from '../forms/input-field-view';
import { getRdfSuperProperties } from '../utilities/linked-data-utilities';

import linkedItemTemplate from './linked-item-editor-template';
import TypeAwareHelpText from './type-aware-help-view';

// Selector of the control where the object picker is inserted.
const objectControl = '.field.has-addons .control:nth-child(2)';

export default class LinkedItemEditor extends CompositeView {
    collection: Graph;
    range: Graph;
    predicatePicker: Select2Picker;
    removeButton: RemoveButton;
    literalField: InputField;
    typeAwareHelp: TypeAwareHelpText;

    initialize() {
        this.range = new Graph;
        this.predicatePicker = new Select2Picker({collection: this.collection});
        this.literalField = new InputField();
        this.removeButton = new RemoveButton().on('click', this.close, this);
        this.typeAwareHelp = new TypeAwareHelpText({collection: this.range});
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
        this.updateRange();
        this.updateObject(this.literalField, this.literalField.getValue());
    }

    updateRange(): this {
        const predicate = this.model.get('predicate');
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
        this.typeAwareHelp.updateRange(this.range);
        return this;
    }

    updateObject(labelField: InputField, val: string): void {
        this.typeAwareHelp.updateHelpText(val);
    }

    predicateFromModel(model: Model, selectedPredicate?: Node): this {
        selectedPredicate || (selectedPredicate = model.get('predicate'));
        if (!selectedPredicate) return this;
        this.predicatePicker.val(selectedPredicate.id as string);
        return this;
    }

    objectFromModel(model: Model, setLiteral?: Native): this {
        setLiteral || (setLiteral = model.get('object'));
        if (setLiteral) {
            const jsonld = asLD(setLiteral);
            this.typeAwareHelp.setHelpText(jsonld);
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
    }, {
        view: 'allowedTypesList',
        selector: noMatchHelp,
        method: 'before',
    }, 'detectedTypeHelp'],
});
