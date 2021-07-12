import { extend } from 'lodash';
import FilteredCollection from '../common-adapters/filtered-collection';
import FlatItem from '../common-adapters/flat-item-model';
import { CollectionView } from '../core/view';
import LabelView from '../label/label-view';
import OntologyClassPickerItemView from './ontology-class-picker-item-view';


export default class OntologyClassPickerChildrenView extends CollectionView<
    FlatItem,
    OntologyClassPickerItemView
> {
    // selected: FlatItem;
    label: any;
    externalCloseHandler: any;


    initialize(): this {
        this.initItems().render().initCollectionEvents();
        return this;
    }

    makeItem(model: FlatItem): OntologyClassPickerItemView {
        return new OntologyClassPickerItemView({ model, level: 0 }).on({
            click: this.onItemClicked,
            activated: this.onItemActivated,
        }, this);
    }

    // placeItems(): this {
    //     super.placeItems();
    //     // if (this.selected) this.setLabel(this.selected);
    //     return this;
    // }

    remove(): this {
        if (this.label) this.label.remove();
        super.remove();
        return this;
    }

    // getSelected(): FlatItem {
    //     return this.selected;
    // }

    // select(newValue: FlatItem) {
    //     if (newValue === this.selected) return;
    //     this.selected = newValue;
    //     this.items.forEach((item) => {
    //         if (item.model === newValue) {
    //             item.activate();
    //             this.trigger('select', newValue);
    //         } else {
    //             item.deactivate();
    //         }
    //     });
    //     this.render();
    // }

    // setLabel(item: FlatItem): this {
    //     let dropdownLabel = this.$('.dropdown-label-tag');
    //     if (this.label) this.label.remove();
    //     dropdownLabel.text('');
    //     this.label = new LabelView({ model: item });
    //     this.label.$el.appendTo(dropdownLabel);
    //     return this;
    // }

    onItemClicked(view: OntologyClassPickerItemView): this {
        // this.select(view.model);
        this.trigger('selected', view.model);
        return this;
    }

    onItemActivated(view: OntologyClassPickerItemView): this {
        // this.setLabel(view.model);
        this.trigger('activated', view.model)
        return this;
    }
}

extend(OntologyClassPickerChildrenView.prototype, {
    className: 'ontology-class-picker',
    tagName: 'div',
});
