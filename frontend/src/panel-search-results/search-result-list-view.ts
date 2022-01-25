import { extend, invokeMap } from 'lodash';

import { CollectionView, ViewOptions as BaseOpt } from '../core/view';
import FlatItem from '../common-adapters/flat-item-model';

import SearchResultView from './search-result-base-view';

export interface ViewOptions extends BaseOpt {
    selectable: boolean;
}

export default
class SearchResultListView extends CollectionView<FlatItem, SearchResultView> {
    selectable: boolean;
    attached: boolean;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.selectable = (options.selectable === undefined) || options.selectable;
        this.initItems().initCollectionEvents();
        this.listenToOnce(this.collection, 'add', this.render);
        return this;
    }

    makeItem(model: FlatItem): SearchResultView {
        return new SearchResultView({
            model,
            selectable: this.selectable,
        }).render();
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
}

extend(SearchResultListView.prototype, {
    tagName: 'div',
    className: 'result-list'
});
