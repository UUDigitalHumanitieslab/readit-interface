import { extend } from 'lodash';
import FilteredCollection from '../common-adapters/filtered-collection';
import FlatItem from '../common-adapters/flat-item-model';
import { skos } from '../common-rdf/ns';
import { CollectionView } from '../core/view';
import LabelView from '../label/label-view';
import OntologyClassPickerItemView from './ontology-class-picker-item-view';
import ontologyClassPickerTemplate from './ontology-class-picker-template';


export default class OntologyClassPickerView extends CollectionView<
    FlatItem,
    OntologyClassPickerItemView
> {
    selected: FlatItem;
    label: any;
    externalCloseHandler: any;
    leafNodes: FilteredCollection<FlatItem>;


    initialize(): this {
        this.filterOntology(this.collection);
        this.initItems().render().initCollectionEvents();
        this.externalCloseHandler = $(document).click(() => this.hideDropdown());
        return this;
    }

    makeItem(model: FlatItem): OntologyClassPickerItemView {
        const level = this.isLeaf(model) ? 1 : 0;
        return new OntologyClassPickerItemView({ model, level }).on({
            click: this.onItemClicked,
            hover: level === 0 ? this.onSuperclassHovered : undefined,
            activated: this.onItemActivated,
        }, this);
    }

    isLeaf(node: FlatItem) {
        return node.underlying.has(skos.related);
    }

    isNonLeaf(node) {
        return !node.underlying.has(skos.related);
    }

    /**
     * Separate the ontology into leaf and non-leaf nodes
     * @param collection
     */
    filterOntology(collection) {
        this.leafNodes = new FilteredCollection<FlatItem>(collection, this.isLeaf);
        this.collection = new FilteredCollection<FlatItem>(collection, this.isNonLeaf);
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

    getSelected(): FlatItem {
        return this.selected;
    }

    select(newValue: FlatItem) {
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
        this.render();
    }

    setLabel(item: FlatItem): this {
        let dropdownLabel = this.$('.dropdown-label-tag');
        if (this.label) this.label.remove();
        dropdownLabel.text('');
        this.label = new LabelView({ model: item });
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

    onSuperclassHovered(model: FlatItem) {
        this.leafNodes.forEach(node => {
            const prefParent = node.underlying.get(skos.related)[0] as FlatItem;

            if (prefParent.id == model.id) {
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
