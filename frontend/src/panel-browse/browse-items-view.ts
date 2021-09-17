import { extend } from 'lodash';

import { baseUrl } from 'config.json';

import { CompositeView } from "../core/view";
import { itemsByUserQuery } from "../sparql/compile-query";
import ldChannel from '../common-rdf/radio';
import explorerChannel from '../explorer/explorer-radio';
import {dcterms, oa} from '../common-rdf/ns'

import FlatItem from '../common-adapters/flat-item-model';
import ItemGraph from "../common-adapters/item-graph";
import FlatItemCollection from "../common-adapters/flat-item-collection";
import SearchResultListView from '../panel-search-results/search-result-list-view';

import browseTemplate from './browse-template';
import { formatNamespaces } from '../utilities/sparql-utilities';
import Model from '../core/model';

const itemCounterUrl = baseUrl + 'item/current';
const namespaces = {
    'dcterms': dcterms(),
    'oa': oa()
};
const retrieveCount = 50;

export default class BrowseItemsView extends CompositeView {
    currentUser: string;
    resultsList: SearchResultListView;
    title = "Items";
    counter: Model;

    async initialize() {
        this.currentUser = ldChannel.request('current-user-uri');
        const random = true;
        const sparqlItems = new ItemGraph();
        let options = {namespaces: formatNamespaces(namespaces)};
        if (random) {
            this.counter = new Model();
            await this.counter.fetch({ url: itemCounterUrl});
            const filterMax = Math.floor(Math.random() * this.counter.get('max_count'));
            options['filterMax'] = this.counter.get('item_namespace').concat(filterMax.toString());
            const filterMin = this.counter.get('item_namespace').concat((filterMax - retrieveCount).toString());
            options['filterMin'] = filterMin;
        }
        const query = itemsByUserQuery(this.currentUser, options);
        const sourceGraph = 'item/query';
        await sparqlItems.sparqlQuery(query, sourceGraph);
        this.resultsList = new SearchResultListView({
            collection: new FlatItemCollection(sparqlItems),
            selectable: false }).render();
        this.listenTo(this.resultsList, {
            focus: this.onFocus,
            blur: this.onBlur
        });
        this.render();
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
extend(BrowseItemsView.prototype, {
    template: browseTemplate,
    className: 'browse explorer-panel',
    subviews: [
        {
            view: 'resultsList',
            selector: '.user-results'
        },
    ]
});