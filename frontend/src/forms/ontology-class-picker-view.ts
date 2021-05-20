import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';

import { CollectionView } from '../core/view';
import Node from '../common-rdf/node';
import LabelView from '../label/label-view';

import OntologyClassPickerItemView from './ontology-class-picker-item-view';
import ontologyClassPickerTemplate from './ontology-class-picker-template';
import { vocab } from '../common-rdf/ns';

import FilteredCollection from '../common-adapters/filtered-collection';
import Graph from '../common-rdf/graph';

export interface ViewOptions extends BaseOpt<Node> {
    preselection?: Node;
}

export default class OntologyClassPickerView extends CollectionView<
    Node,
    OntologyClassPickerItemView
> {
    selected: Node;
    label: any;
    externalCloseHandler: any;
    leafNodes: FilteredCollection<Node, Graph>;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.filterOntology(this.collection);
        const preselection = options.preselection;
        this.initItems().initCollectionEvents().select(preselection);
        this.selected = preselection;
        this.externalCloseHandler = $(document).click(() => this.hideDropdown());
        return this;
    }

    makeItem(model: Node): OntologyClassPickerItemView {
        const level = this.isLeaf(model) ? 1 : 0;
        return new OntologyClassPickerItemView({ model, level }).on({
            click: level === 0 ? this.onSuperclassClick : this.onItemClicked,
            hover: level === 0 ? this.onSuperclassHovered : undefined,
            activated: this.onItemActivated,
        }, this);
    }

    isLeaf(node) {
        return node.has(vocab.hasPrefSuperClass);
    }

    isNonLeaf(node) {
        return !node.has(vocab.hasPrefSuperClass);
    }

    /**
     * Separate the ontology into leaf and non-leaf nodes
     * @param collection
     */
    filterOntology(collection) {
        this.leafNodes = new FilteredCollection(collection, this.isLeaf);
        this.collection = new FilteredCollection<Node, Graph>(collection, this.isNonLeaf);
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    placeItems(): this {
        super.placeItems();
        if (this.selected) this.setLabel(this.selected);
        return this;
    }

    remove(): this {
        this.externalCloseHandler.off();
        if (this.label) this.label.remove();
        super.remove();
        return this;
    }

    getSelected(): Node {
        return this.selected;
    }

    select(newValue: Node) {
        if (newValue === this.selected) return;
        this.selected = newValue;
        this.items.forEach((item) => {
            if (item.model === newValue) {
                item.activate();
                this.trigger('select', newValue);
            } else {
                item.deactivate();
            }
        });
    }

    setLabel(node: Node): this {
        let dropdownLabel = this.$('.dropdown-label-tag');
        if (this.label) this.label.remove();
        dropdownLabel.text('');
        this.label = new LabelView({ model: node });
        this.label.$el.appendTo(dropdownLabel);
        return this;
    }

    hideDropdown(): this {
        this.$('.dropdown').removeClass('is-active');
        return this;
    }

    onClick(event: any): this {
        this.$('.dropdown').toggleClass('is-active');
        event.stopPropagation();
        return this;
    }

    onSuperclassClick(event: any): this {
        return this;
    }

    onItemClicked(view: OntologyClassPickerItemView): this {
        this.select(view.model);
        return this;
    }

    onSuperclassHovered(model: Node) {
        this.leafNodes.forEach(node => {
            const isDirectChild = (node.get(vocab.hasPrefSuperClass)[0] == model);
            if (isDirectChild) {
                const modelIndex = this.collection.indexOf(model);
                this.collection.add(node, { at: modelIndex + 1 });
            } else {
                this.collection.remove(node);
            }
        });

    }

    onItemActivated(view: OntologyClassPickerItemView): this {
        this.setLabel(view.model);
        return this;
    }
}

extend(OntologyClassPickerView.prototype, {
    className: 'ontology-class-picker',
    template: ontologyClassPickerTemplate,
    container: '.dropdown-content',
    events: {
        'click': 'onClick',
    }
});
