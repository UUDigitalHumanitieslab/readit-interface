import { extend } from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import { CompositeView, CollectionView } from '../core/view';
import { rdf } from '../jsonld/ns';
import Node from '../jsonld/node';
import Graph from '../jsonld/graph';
import PickerView from '../forms/base-picker-view';
import ItemGraph from '../utilities/item-graph';
import relatedItemsTemplate from './related-items-template';
import relationTemplate from './relation-editor-template';

export class RelationEditor extends CompositeView {
    predicatePicker: PickerView;
    objectPicker: PickerView;
    objectOptions: ItemGraph;

    initialize() {
        this.predicatePicker = new PickerView({collection: this.collection});
        this.objectOptions = new ItemGraph();
        this.objectPicker = new PickerView({collection: this.objectOptions});
        this.predicatePicker.on('change', this.updatePredicate, this);
        this.objectPicker.on('change', this.updateObject, this);
        if (!this.model) this.model = new Model();
        this.listenTo(this.model, 'change:predicate', this.predicateFromModel);
        this.listenTo(this.model, 'change:object', this.objectFromModel);
        this.predicateFromModel(this.model).objectFromModel(this.model);
    }

    updatePredicate(picker: PickerView, id: string): void {
        this.model.set('predicate', this.collection.get(id));
    }

    updateObject(picker: PickerView, id: string): void {
        this.model.set('object', this.collection.get(id));
    }

    predicateFromModel(model: Model, selectedPredicate?: Node): this {
        selectedPredicate || (selectedPredicate = model.get('predicate'));
        if (!selectedPredicate) return this;
        this.objectOptions.query({
            predicate: rdf.type,
            object: selectedPredicate.id,
        });
        this.predicatePicker.val(selectedPredicate.id);
        return this;
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
        selector: '.control:first',
    }, {
        view: 'objectPicker',
        selector: '.control:last',
    }],
});

export default class RelatedItemsEditor extends CollectionView {
    availablePredicates: Graph;
}
