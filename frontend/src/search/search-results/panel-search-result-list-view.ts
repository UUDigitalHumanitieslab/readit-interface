import { extend, invokeMap } from 'lodash';

import View, { CollectionView, ViewOptions as BaseOpt } from '../../core/view';
import Node from '../../jsonld/node';
import Graph from '../../jsonld/graph';
import FlatItem from '../../annotation/flat-item-model';
import explorerChannel from '../../explorer/radio';
import { announceRoute } from '../../explorer/utilities';

import searchResultListTemplate from './panel-search-result-list-template';
import SearchResultView from './search-result-base-view';

// TODO: the search results list is general enough to be used for other purposes
// than item annotations. Fix the route announcement when we decide to do this.
const announce = announceRoute('item:annotations', ['model', 'id']);

export interface ViewOptions extends BaseOpt {
    selectable: boolean;
    /**
     * The title displayed above the result list. Defaults to 'Search Results'.
     */
    title?: string;
}

export default
class SearchResultListView extends CollectionView<FlatItem, SearchResultView> {
    selectable: boolean;
    title: string;
    attached: boolean;

    currentlySelected: SearchResultView;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.selectable = (options.selectable === undefined) || options.selectable;
        this.title = options.title || 'Search Results';

        this.initItems().initCollectionEvents();
        this.on('announceRoute', announce);
        return this;
    }

    makeItem(model: FlatItem): SearchResultView {
        const item = new SearchResultView({
            model,
            selectable: this.selectable,
        }).render();
        item.on('click', this.onItemClicked, this);
        return item;
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    placeItems(): this {
        super.placeItems();
        if (this.attached) invokeMap(this.items, 'activate');
        return this;
    }

    activate(): this {
        this.attached = true;
        return this.render();
    }

    processSelection(subView: SearchResultView): this {
        if (this.currentlySelected) this.unSelect(this.currentlySelected);
        this.select(subView);
        return this;
    }

    select(subView: SearchResultView): this {
        subView.highlight();
        this.currentlySelected = subView;
        return this;
    }

    unSelect(subView: SearchResultView): this {
        subView.unhighlight();
        return this;
    }

    onItemClicked(subView: SearchResultView): this {
        this.processSelection(subView);
        explorerChannel.trigger('searchResultList:itemClicked', this, subView.model);
        return this;
    }
}

extend(SearchResultListView.prototype, {
    tagName: 'div',
    className: 'search-result-list explorer-panel',
    template: searchResultListTemplate,
    container: '.results-container',
});
