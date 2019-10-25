import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from './../../core/view';

import searchResultListTemplate from './panel-search-result-list-template';

import Node from '../../jsonld/node';
import Graph from '../../jsonld/graph';
import SearchResultBaseItemView from './search-result-base-view';

export interface ViewOptions extends BaseOpt {
    collection: Graph;
    selectable: boolean;
    /**
     * The title displayed above the result list. Defaults to 'Search Results'.
     */
    title?: string;
}

export default class SearchResultListView extends View {
    selectable: boolean;
    title: string;

    items: SearchResultBaseItemView[];

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.selectable = (options.selectable === undefined) || options.selectable;
        this.title = options.title || 'Search Results';

        this.items = [];
        this.collection.each(n => {
            this.initItem(n as Node);
        });
        return this;
    }

    initItem(node: Node): this {
        let item = new SearchResultBaseItemView({
            model: node, selectable: this.selectable
        });
        item.render();
        this.listenTo(item, 'click', this.onItemClicked);
        this.items.push(item);
        return this;
    }

    render(): this {
        if (this.items) {
            this.items.forEach(view => {
                view.$el.detach();
            });
        }

        this.$el.html(this.template(this));

        if (this.items) {
            this.items.forEach(view => {
                this.$('.results-container').append(view.el);
            });
        }
        return this;
    }

    onItemClicked(subView: View): this {
        this.trigger('searchResultList:itemClicked', this, subView.model);
        return this;
    }
}
extend(SearchResultListView.prototype, {
    tagName: 'div',
    className: 'search-result-list explorer-panel',
    template: searchResultListTemplate,
    events: {
    }
});
