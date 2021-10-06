import { extend, partial } from 'lodash';

import { CollectionView } from '../core/view';
import { getScrollTop, animatedScroll, ScrollType } from '../utilities/scrolling-utilities';
import ItemSummaryBlock from '../item-summary-block/item-summary-block-view';
import LoadingSpinnerView from '../loading-spinner/loading-spinner-view';
import { announceRoute } from '../explorer/utilities';
import FlatItem from '../common-adapters/flat-item-model';
import FlatCollection from '../common-adapters/flat-annotation-collection';
import ToggleMixin from '../category-colors/category-toggle-mixin';

const announce = announceRoute('source:annotated', ['model', 'id']);
const hideCategories = partial(ToggleMixin.prototype.toggleCategories, null);

/**
 * Panel subview that displays a list of annotations as ItemSummaryBlocks.
 *
 * Self-rendering view, autoscrolls to the selected annotation on focus.
 */
interface AnnotationListView extends ToggleMixin {}
class AnnotationListView extends CollectionView<FlatItem, ItemSummaryBlock> {
    collection: FlatCollection;
    // This is mostly a CollectionView of ItemSummaryBlocks, but we occasionally
    // also behave a bit like a CompositeView with the loadingSpinnerView as the
    // subview.
    loadingSpinnerView: LoadingSpinnerView;
    summaryList: JQuery<HTMLElement>;
    // Lookup table from annotation to block, amortized constant lookup time.
    _byId: { [cid: string]: ItemSummaryBlock };

    initialize(): void {
        this._byId = {};
        this.loadingSpinnerView = new LoadingSpinnerView();
        this.initItems().render();
        this.listenToOnce(this.collection.underlying, {
            sync: this._hideLoadingSpinner,
            error: this._hideLoadingSpinner,
        }).listenTo(this.collection, {
            focus: this._handleFocus,
            // We work with a slightly modified list of event handlers compared
            // to what CollectionView binds by default.
            add: this.insertItem,
            remove: this.removeItem,
            sort: this.placeItems,
            reset: this.resetItems,
            'filter:exclude': hideCategories,
        }).on('announceRoute', announce);
    }

    _hideLoadingSpinner(): void {
        if (this.loadingSpinnerView) {
            this.loadingSpinnerView.remove();
            delete this.loadingSpinnerView;
        }
        this.placeItems();
    }

    _handleFocus(model: FlatItem): void {
        this.scrollTo(model);
        this.trigger('annotation:clicked', model);
    }

    makeItem(model: FlatItem): ItemSummaryBlock {
        const block = new ItemSummaryBlock({ model }).on({
            hover: this.onSummaryBlockedHover,
        });
        this._byId[model.cid] = block;
        return block;
    }

    removeItem(model, collection, options) {
        delete this._byId[model.cid];
        return super.removeItem(model, collection, options);
    }

    detachItems(): this {
        if (this.loadingSpinnerView) {
            this.loadingSpinnerView.$el.detach();
        } else {
            super.detachItems();
        }
        return this;
    }

    placeItems(): this {
        if (this.loadingSpinnerView) {
            this.loadingSpinnerView.$el.appendTo(this.$el);
        } else {
            // Behaving like a CollectionView in this branch, but we always
            // combine sorting and placing because this method is bound to the
            // 'sort' event.
            this.sortItems().$el.hide();
            super.placeItems();
            this.$el.show();
        }
        return this;
    }

    resetItems(): this {
        super.resetItems();
        this._hideLoadingSpinner();
        return this;
    }

    remove(): this {
        if (this.loadingSpinnerView) this.loadingSpinnerView.remove();
        return super.remove();
    }

    scrollTo(annotation: FlatItem): this {
        if (!annotation) return this;
        const scrollToBlock = this._byId[annotation.cid];

        if (scrollToBlock) {
            let scrollableEl = this.$el;
            let scrollTarget = getScrollTop(scrollableEl, scrollToBlock.getTop(), scrollToBlock.getHeight());
            animatedScroll(ScrollType.Top, scrollableEl, scrollTarget);
        }
        return this;
    }

    onSummaryBlockedHover(annotation: FlatItem): this {
        this.trigger('hover', annotation);
        return this;
    }
}

extend(AnnotationListView.prototype, ToggleMixin.prototype, {
    className: 'annotation-list',
});

export default AnnotationListView;
