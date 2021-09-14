import { extend, invokeMap, uniqueId, after, once } from 'lodash';
import 'select2';

import { CompositeView } from '../core/view';
import ldChannel from '../common-rdf/radio';
import { oa, rdf, skos, vocab } from '../common-rdf/ns';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';

import LinkedItemsCollectionView from '../item-edit/linked-items-collection-view';
import Multifield from '../forms/multifield-view';
import PickerView from '../forms/select2-picker-view';
import ItemGraph from '../common-adapters/item-graph';
import ClassPickerView from '../forms/ontology-class-picker-view';
import SnippetView from '../snippet/snippet-view';
import { isBlank, isAnnotationCategory } from '../utilities/linked-data-utilities';
import { placeholderClassItem } from '../utilities/annotation-utilities';
import {
    savePlaceholderAnnotation,
} from '../utilities/annotation-creation-utilities';
import explorerChannel from '../explorer/explorer-radio';

import FlatItem from '../common-adapters/flat-item-model';
import FlatCollection from '../common-adapters/flat-item-collection';
import FlatItemCollection from '../common-adapters/flat-item-collection';

import { announceRoute } from './utilities';
import annotationEditTemplate from './annotation-edit-template';
import FilteredCollection from '../common-adapters/filtered-collection';
import Collection from '../core/collection';

/**
 * Helper function in order to pass the right classes to the classPicker.
 */
export function getOntologyClasses() {
    const ontology = ldChannel.request('ontology:graph') || new Graph();
    return new FilteredCollection<FlatItem>(ontology, isAnnotationCategory);
}

const announce = announceRoute(true);

export default class AnnotationEditView extends CompositeView<FlatItem> {
    collection: FlatCollection;
    classPicker: ClassPickerView;
    snippetView: SnippetView;
    userIsOwner: boolean;
    needsVerification: boolean;
    itemPicker: PickerView;
    itemOptions: ItemGraph;
    itemCollectionView: LinkedItemsCollectionView;
    itemMultifield: Multifield;
    originalBodies: Node[];
    ontologyClasses: Graph;

    initialize() {
        this.itemOptions = new ItemGraph();
        this.itemOptions.comparator = this.sortOptions;
        this.itemPicker = new PickerView({ collection: this.itemOptions });
        this.ontologyClasses = new Graph();
        const categories = new FlatItemCollection(this.ontologyClasses);
        this.getOntologyClasses();
        this.classPicker = new ClassPickerView({
            collection: categories
        });
        this.snippetView = new SnippetView({ model: this.model }).render();
        this.model.when('annotation', this.processAnnotation, this);
        this.model.when('class', this.processClass, this);
        this.model.when('item', this.processItem, this)
        this.model.on('change:needsVerification', this.changeVerification, this);
        // Two conditions must be met before we run processItem:
        const processItem = after(2, this.processItem);
        // 1. the original item body of the annotation is known,
        const triggerItemConfirmed = once(processItem);
        this.model.when('item', triggerItemConfirmed, this);
        //    OR we know that it has no item whatsoever;
        this.listenToOnce(this.model, 'complete', triggerItemConfirmed);
        if (this.model.complete) triggerItemConfirmed();
        // 2. this item is available to the itemPicker.
        this.itemOptions.once('update', processItem, this);

        this.render();
        this.on('announceRoute', announce);
    }

    processAnnotation(model: FlatItem, annotation: Node): void {
        this.originalBodies = annotation.get(oa.hasBody) as Node[];
        const creator = model.get('creator') as Node;
        const currentUser = ldChannel.request('current-user-uri');
        if (creator && (creator.id === currentUser)) this.userIsOwner = true;
        if (this.userIsOwner) this.render();
        this.needsVerification = model.get('needsVerification');
        if (this.needsVerification) this.render();
    }

    /**
    * Helper function in order to pass the right classes to the classPicker.
    */
    async getOntologyClasses() {
        // TODO: request only items of type rdfs:class via SPARQL
        const ontology = await ldChannel.request('ontology:promise');
        this.ontologyClasses.set(ontology.models.filter(model => isAnnotationCategory(model)));
        return ontology;
    }

    processClass(model: FlatItem, selClass: Node): void {
        const cls = this.classPicker.collection._underlying.get(selClass.id);
        this.classPicker.select(cls);
        this.selectClass(cls);
        this.classPicker.on('select', this.changeClass, this);
    }

    processItem(): void {
        const item = this.model.get('item');
        if (item) {
            this.itemPicker.val(item.id);
            this.editItem(item);
        }
        this.itemPicker.on('change', this.selectItem, this);
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        this.mirrorClassInput(this.model.get('class'));
        return this;
    }

    remove(): this {
        super.remove();
        return this;
    }

    sortOptions(model1, model2): number {
        if (model1.get(skos.prefLabel) < model2.get(skos.prefLabel)) {
            return -1;
        }
        if (model1.get(skos.prefLabel) > model2.get(skos.prefLabel)) {
            return 1;
        }
        else return 0;
    }

    submit(): this {
        if (this.model.get('classLabel') === 'Selection') {
            this.$('p.class-unset').removeClass('is-hidden');
            return this;
        }
        this.$('p.class-unset').addClass('is-hidden');
        const item = this.model.get('item');
        if (this.itemCollectionView && this.itemCollectionView.model === item) {
            if (!this.itemCollectionView.validatePrefLabel()) {
                this.$('p.label-unset').removeClass('is-hidden');
                return this;
            }
            this.$('p.label-unset').addClass('is-hidden');
            this.itemCollectionView.commitChanges();
        }

        const annotation = this.model.get('annotation');
        if (this.model.isNew() || annotation && isBlank(annotation)) {
            this.submitNewAnnotation();
        } else {
            this.submitItem().then(this.submitOldAnnotation.bind(this));
        }
        return this;
    }

    submitItem(): Promise<boolean> {
        let newItem = false;
        const item = this.model.get('item');
        if (!item) return Promise.resolve(newItem);
        if (isBlank(item)) item.unset('@id');
        if (item.isNew()) {
            newItem = true;
            if (!item.collection) this.itemOptions.add(item);
        }
        return new Promise((resolve, reject) => {
            item.save();
            item.once('sync', () => resolve(newItem));
            item.once('error', reject);
        });
    }

    submitNewAnnotation(): void {
        savePlaceholderAnnotation(
            this.model,
            (error, results) => {
                if (error) return console.debug(error);
                explorerChannel.trigger(
                    'annotationEditView:saveNew',
                    this,
                    this.model,
                    results.items,
                );
            }
        );
    }

    submitOldAnnotation(newItem: boolean): void {
        const annotation = this.model.get('annotation');
        if (annotation) {
            if (newItem) {
                // The item node may still be linked as a blank node. Relink.
                const cls = this.model.get('class');
                const item = this.model.get('item');
                annotation.unset(oa.hasBody).set(oa.hasBody, [cls, item]);
            }
            annotation.save({ patch: true });
        }
        explorerChannel.trigger('annotationEditView:save', this, this.model, newItem);
    }

    reset(): this {
        const annotation = this.model.get('annotation');
        if (annotation) {
            annotation.unset(oa.hasBody);
            if (this.originalBodies) {
                annotation.set(oa.hasBody, this.originalBodies);
            }
        }
        this.trigger('reset');
        return this;
    }

    mirrorClassInput(cls: FlatItem): void {
        if (cls) this.$('.hidden-input').val(cls.id).valid();
    }

    selectClass(cls: FlatItem): this {
        if (!cls || cls === placeholderClassItem) return this;
        this.mirrorClassInput(cls);
        this.itemOptions.query({
            predicate: rdf.type,
            object: cls.id as string,
        });
        this.$('.item-picker-container').removeClass('is-hidden');
        this.$('.item-edit-container').addClass('is-hidden');
        this.$('p.class-unset').addClass('is-hidden');
        return this;
    }

    changeClass(cls: FlatItem): void {
        const annotation = this.model.get('annotation');
        annotation.unset(oa.hasBody);
        annotation.set(oa.hasBody, cls.underlying);
        this.selectClass(cls);
    }

    changeVerification(model: FlatItem): void {
        this.needsVerification = model.get('needsVerification');
    }

    selectItem(itemPicker: PickerView, id: string): void {
        this.setItem(this.itemOptions.get(id));
    }

    setItem(selectedItem?: Node): void {
        const previousItem = this.model.get('item');
        if (previousItem === selectedItem) return;
        const annotation = this.model.get('annotation');
        previousItem && annotation.unset(oa.hasBody, previousItem);
        if (selectedItem) {
            annotation.set(oa.hasBody, selectedItem);
            this.editItem(selectedItem);
        }
    }

    createItem(): this {
        const item = new Node({
            '@id': uniqueId('_:'),
            '@type': this.model.get('class').id,
            [skos.prefLabel]: '', // this prevents a failing getLabel
        });
        this.setItem(item);
        return this;
    }

    editItem(item?: Node): this {
        if (!item) {
            item = this.model.get('item');
        }
        this.setItemMultifield(item);
        return this;
    }

    setItemMultifield(item: Node): this {
        if (this.itemCollectionView) this.itemCollectionView.remove();
        if (this.itemMultifield) this.itemMultifield.remove();
        this.itemCollectionView = new LinkedItemsCollectionView({
            model: item,
            collection: new Collection()
        });
        this.itemMultifield = new Multifield({
            collectionView: this.itemCollectionView
        });
        this.$('.item-edit-container').append(this.itemMultifield.el);
        this.$('.item-edit-container').removeClass('is-hidden');
        this.$('.item-picker-container').removeClass('is-hidden');
        return this;
    }

    onSaveClicked(event: JQueryEventObject): this {
        event.preventDefault();
        if (this.$(".anno-edit-form").valid()) {
            this.submit();
        }
        return this;
    }

    onCancelClicked(event: JQueryEventObject): this {
        event.preventDefault();
        this.reset();
        if (isBlank(this.model.underlying)) {
            // Remove the placeholder.
            this.collection.underlying.remove(this.model.underlying);
        }
        explorerChannel.trigger('annotationEditView:close', this);
        return this;
    }

    async onDelete(): Promise<void> {
        const annotation = this.model.get('annotation');
        const details = [
            this.model.get('quoteSelector'),
            this.model.get('positionSelector'),
            this.model.get('target'),
        ];
        // We wait for the oa:Annotation to be destroyed, then destroy its
        // target and selectors without waiting whether deletion was successful.
        // Incomplete deletion should not trouble the user.
        await annotation.destroy({ wait: true });
        invokeMap(details, 'destroy');
    }

    onVerificationChanged() {
        this.model.underlying.unset(vocab.needsVerification);
        this.needsVerification = !this.needsVerification;
        this.model.underlying.set(vocab.needsVerification, this.needsVerification);
    }

    saveOnEnter(event) {
        if (event.keyCode == 13) {
            this.submit();
        }
    }
}

extend(AnnotationEditView.prototype, {
    className: 'annotation-edit-panel explorer-panel',
    template: annotationEditTemplate,
    subviews: [{
        view: 'classPicker',
        selector: '.ontology-class-picker-container',
    }, {
        view: 'itemPicker',
        selector: '.item-picker-container .field:first .control',
    }, {
        view: 'snippetView',
        selector: '.snippet-container',
        }, {
        view: 'itemMultifield',
        place: false,
        selector: '.item-multifield'
    }
    ],
    events: {
        'submit': 'onSaveClicked',
        'click .panel-footer button.btn-cancel': 'onCancelClicked',
        'click .panel-footer button.is-danger': 'onDelete',
        'click .btn-rel-items': 'onRelatedItemsClicked',
        'click .item-picker-container .field .create-item-button': 'createItem',
        'keyup input': 'saveOnEnter',
        'change .verification-checkbox': 'onVerificationChanged'
    },
});
