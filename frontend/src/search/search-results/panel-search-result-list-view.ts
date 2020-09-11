import { extend, invokeMap } from 'lodash';

import View, { ViewOptions as BaseOpt } from '../../core/view';
import Node from '../../jsonld/node';
import Graph from '../../jsonld/graph';
import FlatItem from '../../annotation/flat-item-model';
import explorerChannel from '../../explorer/radio';
import { announceRoute } from '../../explorer/utilities';

import searchResultListTemplate from './panel-search-result-list-template';
import SearchResultBaseItemView from './search-result-base-view';

// TODO: the search results list is general enough to be used for other purposes
// than item annotations. Fix the route announcement when we decide to do this.
const announce = announceRoute('item:annotations', ['model', 'id']);

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
    attached: boolean;

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
        this.on('announceRoute', announce);
        return this;
    }

    initItem(node: Node): this {
        let item = new SearchResultBaseItemView({
            model: new FlatItem(node), selectable: this.selectable
        });
        item.render();
        this.listenTo(item, 'click', this.onItemClicked);
        this.items.push(item);
        return this;
    }

    render(): this {
        invokeMap(this.items, 'detach');
        this.$el.html(this.template(this));

        this.items.forEach(view => {
            this.$('.results-container').append(view.el);
        });
        if (this.attached) this.activate();
        return this;
    }

    activate(): this {
        this.attached = true;
        invokeMap(this.items, 'activate');
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
