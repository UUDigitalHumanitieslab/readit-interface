import { extend, get } from 'lodash';
import * as i18next from 'i18next';

import {
    CompositeView,
    callActivate,
    ViewOptions as BaseOpt,
} from '../core/view';
import FlatItem from '../common-adapters/flat-item-model';
import explorerChannel from '../explorer/explorer-radio';
import { announceRoute } from '../explorer/utilities';
import SemanticQuery from '../semantic-search/model';
import LoadingSpinner from '../loading-spinner/loading-spinner-view';

import searchResultListTemplate from './search-result-list-template';
import SearchResultListView from './search-result-list-view';

const announceAnno = announceRoute('item:annotations', ['model', 'id']);
const announceQuery = announceRoute('search:results:semantic', ['model', 'id']);

function announce(): void {
    if (this.model instanceof SemanticQuery) {
        this.model.when('id', announceQuery, this);
    } else if (this.model) {
        announceAnno.call(this);
    } else {
        const [qualifier, nodeType] = this.title.split(' ');
        const route = `explore/${nodeType}${qualifier === 'My' ? '/mine' : ''}`;
        explorerChannel.trigger('currentRoute', route, this);
    }
}

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
    spinner: LoadingSpinner;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.title = options.title || i18next.t('search_results', 'Search Results');
        this.searchList = new SearchResultListView(options).render();
        this.listenTo(this.collection, {
            focus: this.onFocus,
            blur: this.onBlur,
        });
        const promise = get(this.collection, ['underlying', 'promise']);
        if (promise) {
            this.spinner = new LoadingSpinner;
            promise.then(this.removeSpinner.bind(this));
        }
        this.render();
        this.on('announceRoute', announce);
        return this;
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    onFocus(model: FlatItem): void {
        explorerChannel.trigger('searchResultList:itemClicked', this, model);
    }

    onBlur(model: FlatItem, next?: FlatItem): void {
        next || explorerChannel.trigger('searchResultList:itemClosed', this);
    }

    removeSpinner(): void {
        this.dispose('spinner');
    }

    activate(): this {
        return this.forEachSubview(callActivate);
    }
}

extend(SearchResultListPanel.prototype, {
    tagName: 'div',
    className: 'search-result-list explorer-panel',
    template: searchResultListTemplate,
    subviews: [{
        view: 'searchList',
        selector: '.results-container',
    }, {
        view: 'spinner',
        selector: '.results-container',
        method: 'before',
    }],
});
