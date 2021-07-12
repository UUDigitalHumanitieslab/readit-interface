import { extend } from 'lodash';
import FilteredCollection from '../common-adapters/filtered-collection';
import FlatItem from '../common-adapters/flat-item-model';
import Graph from '../common-rdf/graph';
import Node from '../common-rdf/node';
import { skos } from '../common-rdf/ns';
import { CollectionView } from '../core/view';
import LabelView from '../label/label-view';
import OntologyClassPickerItemView from './ontology-class-picker-item-view';
import ontologyClassPickerTemplate from './ontology-class-picker-template';
import OntologyClassPickerChildrenView from './ontology-class-picker-children-view';


export default class OntologyClassPickerView extends CollectionView<
    FlatItem,
    OntologyClassPickerItemView
> {
    selected: FlatItem;
    label: any;
    externalCloseHandler: any;
    leafNodes: FilteredCollection<FlatItem>;
    childrenPicker: OntologyClassPickerChildrenView;


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
            // activated: this.onItemActivated,
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
        if (this.childrenPicker) this.childrenPicker.remove();
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
        this.trigger('select', newValue);
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

    onItemClicked(model: FlatItem): this {
        this.select(model);
        return this;
    }

    // onItemActivated(view: OntologyClassPickerItemView): this {
    //     this.setLabel(view.model);
    //     return this;
    // }

    // onChildItemClicked(model: FlatItem): this {
    //     this.select(model);
    //     return this;
    // }

    // onChildItemActivated(model: FlatItem): this {
    //     this.setLabel(model);
    //     return this;
    // }

    onSuperclassHovered(model: FlatItem) {
        const children = new FilteredCollection<FlatItem>(this.leafNodes, node => {
            const prefParent = node.underlying.get(skos.related)[0] as FlatItem;
            return prefParent.id == model.id;
        })

        this.childrenPicker = new OntologyClassPickerChildrenView({ collection: children })
            .on({
                'selected': this.onItemClicked,
                // 'activated': this.onChildItemActivated
            }, this);


        this.$('.sub-picker').html(this.childrenPicker.el);
    }


}

extend(OntologyClassPickerView.prototype, {
    className: 'ontology-class-picker',
    template: ontologyClassPickerTemplate,
    container: '.super-picker',
    events: {
        'click': 'onClick',
    },
});
