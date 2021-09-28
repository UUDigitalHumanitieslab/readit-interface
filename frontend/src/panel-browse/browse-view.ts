import { extend, sampleSize } from 'lodash';
import {
    ViewOptions as BViewOptions,
} from 'backbone';

import { CompositeView } from "../core/view";
import { randomNodesQuery } from "../sparql/compile-query";
import explorerChannel from '../explorer/explorer-radio';
import ldChannel from '../common-rdf/radio';
import {dcterms, oa} from '../common-rdf/ns'

import Collection from '../core/collection';
import FlatItem from '../common-adapters/flat-item-model';
import ItemGraph from "../common-adapters/item-graph";
import FlatItemCollection from "../common-adapters/flat-item-collection";
import SearchResultListView from '../panel-search-results/search-result-list-view';
import SourceListView from '../panel-source-list/source-list-view';

import browseTemplate from './browse-template';
import Model from '../core/model';
import routePatterns from '../explorer/route-patterns';

const nSamples = 10;

export interface ViewOptions extends BViewOptions<Model> {
    queryMode: string;
    landing: boolean;
}

export default class BrowseView extends CompositeView {
    resultsList: SearchResultListView | SourceListView;
    counter: Model;
    nodeList: Collection;
    endpoint: string;
    title: string;
    sparqlItems: ItemGraph;
    routePattern: string;

    async initialize(options: ViewOptions) {
        const queryingItems = options.queryMode === 'Items'? true : false;
        this.endpoint =  queryingItems? 'item/query' : 'source/query';
        this.routePattern = queryingItems? routePatterns['browse:items'] : routePatterns['browse:sources'];
        if (options.landing) {
            this.title = "My " + options.queryMode;
            this.getUserNodes(queryingItems);
        }
        else {
            this.awaitNodeList(queryingItems).then( (nodes) => {
                this.getRandomNodes(nodes);
            });
        }
        this.renderResults(queryingItems);
        this.render();
    }

    async awaitNodeList(queryingItems: boolean) {
        if (queryingItems) {
            return await ldChannel.request('promise:item-list');
        }
        else {
            return await ldChannel.request('promise:source-list');
        }
    }

    async getRandomNodes(nodes: Collection) {
        const randomNodes = sampleSize(nodes.models, nSamples);
        const randomQuery = randomNodesQuery(randomNodes.slice(-randomNodes.length, -1), randomNodes.pop(), {});
        this.sparqlItems = new ItemGraph();
        this.sparqlItems.sparqlQuery(randomQuery, this.endpoint);
    }

    async getUserNodes(queryingItems: boolean) {
        if (queryingItems) {
            this.sparqlItems = ldChannel.request('promise:user-items');
        }
        else {
            this.sparqlItems = ldChannel.request('promise:user-sources');
        }
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    renderResults(queryingItems: boolean) {
        if (queryingItems) {
            this.resultsList = new SearchResultListView({
                collection: new FlatItemCollection(this.sparqlItems),
                selectable: false }).render();
            this.listenTo(this.resultsList, {
                focus: this.onFocus,
                blur: this.onBlur
            });
        }
        else {
            this.resultsList = new SourceListView({
                collection: this.sparqlItems
            });
            this.listenTo(
                this.resultsList, 'source:clicked', this.onSourceClicked
            );
        }
    }

    onFocus(model: FlatItem): void {
        explorerChannel.trigger('searchResultList:itemClicked', this, model);
    }

    onBlur(): void {
        explorerChannel.trigger('searchResultList:itemClosed', this);
    }

    onSourceClicked(model: Node): this {
        explorerChannel.trigger('source-list:click', this, model);
        return this;
    }
}
extend(BrowseView.prototype, {
    template: browseTemplate,
    className: 'browse explorer-panel',
    subviews: [
        {
            view: 'resultsList',
            selector: '.user-results'
        },
    ]
});