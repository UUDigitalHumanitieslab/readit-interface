import { extend } from 'lodash';
import FlatItem from '../common-adapters/flat-item-model';
import { CompositeView, ViewOptions as BaseOpt } from '../core/view';

import explorerChannel from '../explorer/explorer-radio';

import searchResultListTemplate from './search-result-list-template';
import SearchResultListView from './search-result-list-view';

export interface ViewOptions extends BaseOpt {
    selectable: boolean;
    /**
     * The title displayed above the result list. Defaults to 'Search Results'.
     */
    title?: string;
}

export default class SearchResultListPanel extends CompositeView {
    title: string;
    searchList: SearchResultListView;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.title = options.title || 'Search Results';
        this.searchList = new SearchResultListView(options).render();
        this.listenTo(this.searchList, 'focus', this.onFocus);
        this.listenTo(this.searchList, 'blur', this.onBlur);
        this.render();
        return this;
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    onFocus(model: FlatItem): void {
        explorerChannel.trigger('searchResultList:itemClicked', this, model);
    }

    onBlur(): void {
        explorerChannel.trigger('searchResultList:itemClosed', this);
    }
}

extend(SearchResultListPanel.prototype, {
    tagName: 'div',
    className: 'search-result-list explorer-panel',
    template: searchResultListTemplate,
    subviews: [
        {
            view: 'searchList',
            selector: '.results-container'
        },
    ]
});
