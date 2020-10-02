import { extend } from 'lodash';

import { CollectionView } from '../core/view';
import { getScrollTop, animatedScroll, ScrollType } from './../utilities/scrolling-utilities';
import ItemSummaryBlock from '../utilities/item-summary-block/item-summary-block-view';
import LoadingSpinnerView from '../utilities/loading-spinner/loading-spinner-view';
import explorerChannel from '../explorer/radio';
import { announceRoute } from '../explorer/utilities';

import FlatItem from './flat-item-model';
import FlatCollection from './flat-annotation-collection';
import annotationsTemplate from './panel-annotation-list-template';

const announce = announceRoute('source:annotated', ['model', 'id']);

/**
 * Explorer panel that displays a list of annotations as ItemSummaryBlocks.
 *
 * Self-rendering view, autoscrolls to the selected annotation on focus.
 */
export default class AnnotationListView extends CollectionView<FlatItem, ItemSummaryBlock> {
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
        this.loadingSpinnerView = new LoadingSpinnerView().render();
        this.initItems().render();
        this.loadingSpinnerView.activate();
        this.listenToOnce(this.collection.underlying, {
            sync: this._hideLoadingSpinner,
            error: this._hideLoadingSpinner,
        }).listenTo(this.collection, {
            focus: this._handleFocus,
            blur: this._handleBlur,
            // We work with a slightly modified list of event handlers compared
            // to what CollectionView binds by default.
            add: this.insertItem,
            remove: this.removeItem,
            sort: this.placeItems,
            reset: this.resetItems,
        }).on('announceRoute', announce);
    }

    _hideLoadingSpinner(): void {
        this.loadingSpinnerView.remove();
        delete this.loadingSpinnerView;
        this.placeItems();
    }

    _handleFocus(model: FlatItem): void {
        this.scrollTo(model);
        explorerChannel.trigger('annotationList:showAnnotation', this, model);
    }

    _handleBlur(lostFocus: FlatItem, gainedFocus?: FlatItem): void {
        if (!gainedFocus) {
            explorerChannel.trigger('annotationList:hideAnnotation', this, lostFocus);
        }
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
            this.loadingSpinnerView.$el.appendTo(this.summaryList);
        } else {
            // Behaving like a CollectionView in this branch, but we always
            // combine sorting and placing because this method is bound to the
            // 'sort' event.
            this.sortItems().summaryList.hide();
            super.placeItems();
            this.summaryList.show();
        }
        return this;
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        this.summaryList = this.$(this.container);
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
            let scrollableEl = this.$('.panel-content');
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

extend(AnnotationListView.prototype, {
    className: 'annotation-list-panel explorer-panel',
    template: annotationsTemplate,
    container: '.summary-list',
});
