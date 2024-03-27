import { extend } from 'lodash';
import FilteredCollection from '../common-adapters/filtered-collection';
import FlatItem from '../common-adapters/flat-item-model';
import Subject from '../common-rdf/subject';
import { skos } from '../common-rdf/ns';
import { CollectionView } from '../core/view';
import LabelView from '../label/label-view';
import attachTooltip from '../tooltip/tooltip-view';
import toTooltip from '../tooltip/tooltip-model';

import OntologyClassPickerChildrenView from './ontology-class-picker-children-view';
import OntologyClassPickerItemView from './ontology-class-picker-item-view';
import ontologyClassPickerTemplate from './ontology-class-picker-template';


export default class OntologyClassPickerView extends CollectionView<
    FlatItem,
    OntologyClassPickerItemView
> {
    selected: FlatItem;
    label: any;
    externalCloseHandler: any;
    leafSubjects: FilteredCollection<FlatItem>;
    childrenPicker: OntologyClassPickerChildrenView;
    collection: FilteredCollection<FlatItem>;

    initialize(): this {
        this.filterOntology(this.collection);
        this.initItems().render().initCollectionEvents();
        this.externalCloseHandler = $(document).on('click', () => this.hideDropdown());
        return this;
    }

    makeItem(model: FlatItem): OntologyClassPickerItemView {
        const item = new OntologyClassPickerItemView({ model }).on({
            click: this.onItemClicked,
            hover: this.isNonLeaf(model) ? this.onSuperclassHovered : undefined,
        }, this);
        attachTooltip(item, { model: toTooltip(model), direction: 'left' });
        return item;
    }

    isLeaf(subject: FlatItem) {
        return subject.underlying.has(skos.related);
    }

    isNonLeaf(subject) {
        return !subject.underlying.has(skos.related);
    }

    /**
     * Separate the ontology into leaf and non-leaf subjects
     * @param collection
     */
    filterOntology(collection) {
        this.leafSubjects = new FilteredCollection<FlatItem>(collection, this.isLeaf);
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
        this.setLabel(this.selected);
        this.selected.trigger('focus', this.selected);
        this.trigger('select', newValue);
    }

    showChildMenu(model: FlatItem) {
        const prefParent = this.getPrefParent(model);
        this.onSuperclassHovered(this.collection.get(prefParent.id));
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
        this.$('.sub-content').addClass('is-hidden');
        return this;
    }

    onClick(event: any): this {
        this.$('.dropdown').toggleClass('is-active');
        event.stopPropagation();
        return this;
    }

    onItemClicked(model: FlatItem): this {
        this.select(model);
        return this;
    }

    getPrefParent(subject: FlatItem) {
        return subject.underlying.get(skos.related)[0] as Subject;
    }

    onSuperclassHovered(model: FlatItem) {
        this.$('.sub-content').addClass('is-hidden');
        this.$('.dropdown-item').removeClass('is-active');
        const children = new FilteredCollection<FlatItem>(this.leafSubjects, subject => {
            const prefParent = this.getPrefParent(subject);
            return prefParent.id == model.id;
        });
        if (this.childrenPicker) this.childrenPicker.remove();
        this.childrenPicker = new OntologyClassPickerChildrenView({ collection: children })
            .on({
                'selected': this.onItemClicked,
            }, this);
        if (this.selected) this.selected.trigger('focus', this.selected);
        this.items.filter(view => view.model == model)[0].onFocus(); // Trigger focus for parent
        this.$('.sub-picker').append(this.childrenPicker.el);
        setTimeout(() => {
            this.$('.sub-content').removeClass('is-hidden');
            // When the submenu is displayed, scroll to selected child element
            this.childrenPicker.scrollToChild(this.selected);
        }, 20);

    }


}

extend(OntologyClassPickerView.prototype, {
    className: 'ontology-class-picker',
    template: ontologyClassPickerTemplate,
    container: '.super-picker',
    events: {
        'click .dropdown-trigger': 'onClick',
    },
});
