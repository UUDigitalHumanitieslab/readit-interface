import { extend, sampleSize } from 'lodash';
import {
    ViewOptions as BViewOptions,
} from 'backbone';

import { baseUrl, sparqlRoot } from 'config.json';

import sourceList from '../global/source-list';
import itemList from '../global/item-list';

import { CompositeView } from "../core/view";
import { listNodesQuery, nodesByUserQuery, randomNodesQuery } from "../sparql/compile-query";
import explorerChannel from '../explorer/explorer-radio';
import {dcterms, oa} from '../common-rdf/ns'

import Collection from '../core/collection';
import FlatItem from '../common-adapters/flat-item-model';
import ItemGraph from "../common-adapters/item-graph";
import FlatItemCollection from "../common-adapters/flat-item-collection";
import SearchResultListView from '../panel-search-results/search-result-list-view';
import SourceListView from '../panel-source-list/source-list-view';

import browseTemplate from './browse-template';
import { formatNamespaces } from '../utilities/sparql-utilities';
import Model from '../core/model';

const namespaces = {
    'dcterms': dcterms(),
    'oa': oa()
};
const nSamples = 10;

export interface ViewOptions extends BViewOptions<Model> {
    landing: boolean;
    queryMode: string;
}

export default class BrowseView extends CompositeView {
    resultsList: SearchResultListView | SourceListView;
    counter: Model;
    nodeList: Collection;
    endpoint: string;
    title: string;

    async initialize(options: ViewOptions) {
        const queryingItems = options.queryMode === 'Items'? true : false;
        this.endpoint =  queryingItems? 'item/query' : 'source/query';
        let namespaceOptions = {namespaces: formatNamespaces(namespaces)};
        const sparqlItems = new ItemGraph();
        if (options.landing) {
            this.title = "My " + options.queryMode;
            const query = nodesByUserQuery(queryingItems, {});
            await sparqlItems.sparqlQuery(query, this.endpoint);
        }
        else {
            this.title = options.queryMode;
            const nodes = queryingItems? itemList : sourceList;
            const randomNodes = sampleSize(nodes.models, nSamples);
            const randomQuery = randomNodesQuery(randomNodes.slice(-randomNodes.length, -1), randomNodes.pop(), {});
            sparqlItems.sparqlQuery(randomQuery, this.endpoint);
        }
        if (queryingItems) {
            this.resultsList = new SearchResultListView({
                collection: new FlatItemCollection(sparqlItems),
                selectable: false }).render();
            this.listenTo(this.resultsList, {
                focus: this.onFocus,
                blur: this.onBlur
            });
        }
        else {
            this.resultsList = new SourceListView({
                collection: sparqlItems
            });
            this.listenTo(
                this.resultsList, 'source:clicked', this.onSourceClicked
            );
        }
        this.render();
    }

    parseResponse(response): [] {
        return response.results.bindings.map( node => node.node );
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