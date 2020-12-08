import { extend } from 'lodash';

import Model from '../core/model';
import { CompositeView } from '../core/view';
import ldChannel from '../core/radio';
import { rdf } from '../common-rdf/ns';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';
import PickerView from '../forms/base-picker-view';
import RangePicker from '../forms/range-picker-view';
import ItemGraph from '../common-adapters/item-graph';
import relationTemplate from './relation-editor-template';

// Selector of the control where the object picker is inserted.
const objectControl = '.control:nth-child(2)';

export default class RelationEditor extends CompositeView {
    collection: Graph;
    predicatePicker: PickerView;
    objectPicker: RangePicker;

    initialize() {
        this.predicatePicker = new PickerView({collection: this.collection});
        this.predicatePicker.on('change', this.updatePredicate, this);
        if (!this.model) this.model = new Model();
        this.predicateFromModel(this.model).objectFromModel(this.model);
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
        this.resetObjectPicker(predicate);
    }

    updateObject(picker: RangePicker, id: string): void {
        this.model.set('object', picker.collection.get(id));
    }

    resetObjectPicker(predicate: Node): this {
        if (this.objectPicker) {
            if (this.objectPicker.model === predicate) return this;
            this.objectPicker.remove();
        }
        this.objectPicker = this.createPicker(predicate);
        this.objectPicker.admittedTypes.forEach(
            t => ldChannel.request('cache:items', t)
        );
        this.objectPicker.on('change', this.updateObject, this);
        this.objectPicker.$el.addClass('is-fullwidth');
        this.$(objectControl).append(this.objectPicker.el);
        return this;
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
        return this.resetObjectPicker(selectedPredicate);
    }

    objectFromModel(model: Model, selectedObject?: Node): this {
        selectedObject || (selectedObject = model.get('object'));
        selectedObject && this.objectPicker.val(selectedObject.id)
        return this;
    }

    close(): void {
        this.trigger('remove', this, this.model);
    }
}

extend(RelationEditor.prototype, {
    className: 'field has-addons rit-relation-editor',
    template: relationTemplate,
    events: {
        'click button.is-danger': 'close',
    },
    subviews: [{
        view: 'predicatePicker',
        selector: '.control:first-child',
    }, {
        view: 'objectPicker',
        selector: objectControl,
    }],
});
