import { extend } from 'lodash';
import FilteredCollection from '../common-adapters/filtered-collection';
import FlatItemCollection from '../common-adapters/flat-item-collection';
import FlatItem from '../common-adapters/flat-item-model';
import { CollectionView } from '../core/view';
import attachTooltip from '../tooltip/tooltip-view';
import { animatedScroll, getScrollTop } from '../utilities/scrolling-utilities';
import OntologyClassPickerItemView from './ontology-class-picker-item-view';


export default class OntologyClassPickerChildrenView extends CollectionView<
    FlatItem,
    OntologyClassPickerItemView
> {
    label: any;
    externalCloseHandler: any;
    collection: FilteredCollection<FlatItem>;


    initialize(): this {
        this.initItems().render().initCollectionEvents();
        return this;
    }

    makeItem(model: FlatItem): OntologyClassPickerItemView {
        const item = new OntologyClassPickerItemView({ model }).on({
            click: this.onItemClicked,
        }, this);
        attachTooltip(item, { model });
        return item;
    }

    remove(): this {
        if (this.label) this.label.remove();
        super.remove();
        return this;
    }

    onItemClicked(model: FlatItem): this {
        this.trigger('selected', model);
        return this;
    }

    scrollToChild(model: FlatItem) {
        // The scroll method works, but the height needs to be restricted TODO
        const view = this.items.filter(view => view.model == model)[0];
        if (!view) return;
        const toScroll = getScrollTop(this.$el, view.$el.offset().top, view.$el.outerHeight());
        this.$el.scrollTop(toScroll);
    }
}

extend(OntologyClassPickerChildrenView.prototype, {
    className: 'ontology-class-picker',
    tagName: 'div',
});
