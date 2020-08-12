import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';

import View from './../../core/view';
import Node from '../../jsonld/node';
import Graph from '../../jsonld/graph';
import explorerChannel from '../../explorer/radio';

import searchResultListTemplate from './panel-search-result-list-template';
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

    currentlySelected: SearchResultBaseItemView;

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

    processSelection(subView: SearchResultBaseItemView): this {
        if (this.currentlySelected) this.unSelect(this.currentlySelected);
        this.select(subView);
        return this;
    }

    select(subView: SearchResultBaseItemView): this {
        subView.select();
        this.currentlySelected = subView;
        return this;
    }

    unSelect(subView: SearchResultBaseItemView): this {
        subView.unSelect();
        return this;
    }

    onItemClicked(subView: SearchResultBaseItemView): this {
        this.processSelection(subView);
        explorerChannel.trigger('searchResultList:itemClicked', this, subView.model);
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
