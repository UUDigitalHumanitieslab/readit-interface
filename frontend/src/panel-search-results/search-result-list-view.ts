import { extend, invokeMap } from 'lodash';

import { CollectionView, ViewOptions as BaseOpt } from '../core/view';
import FlatItem from '../common-adapters/flat-item-model';
import explorerChannel from '../explorer/explorer-radio';
import { announceRoute } from '../explorer/utilities';
import SemanticQuery from '../semantic-search/model';

import searchResultListTemplate from './search-result-list-template';
import SearchResultView from './search-result-base-view';

const announceAnno = announceRoute('item:annotations', ['model', 'id']);
const announceQuery = announceRoute('search:results:semantic', ['model', 'id']);

function announce(): void {
    if (this.model instanceof SemanticQuery) {
        this.model.when('id', announceQuery, this);
    } else announceAnno.call(this);
}

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

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.selectable = (options.selectable === undefined) || options.selectable;
        this.title = options.title || 'Search Results';
        this.initItems().initCollectionEvents();
        this.listenTo(this.collection, {
            focus: this.onFocus,
            blur: this.onBlur,
        });
        this.listenToOnce(this.collection, 'add', this.render);
        this.on('announceRoute', announce);
        return this;
    }

    makeItem(model: FlatItem): SearchResultView {
        return new SearchResultView({
            model,
            selectable: this.selectable,
        }).render();
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

    onFocus(model: FlatItem): void {
        explorerChannel.trigger('searchResultList:itemClicked', this, model);
    }

    onBlur(model: FlatItem, next?: FlatItem): void {
        next || explorerChannel.trigger('searchResultList:itemClosed', this);
    }
}

extend(SearchResultListView.prototype, {
    tagName: 'div',
    className: 'search-result-list explorer-panel',
    template: searchResultListTemplate,
    container: '.results-container',
});
