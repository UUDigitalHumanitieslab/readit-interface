import { extend } from 'lodash';

import { CompositeView } from "../core/view";
import { itemsForSourceQuery, nodesByUserQuery } from "../sparql/compile-query";
import ldChannel from '../common-rdf/radio';

import ItemGraph from "../common-adapters/item-graph";
import Graph from "../common-rdf/graph";
import FlatItemCollection from "../common-adapters/flat-item-collection";
import AnnotationListView from '../panel-annotation-list/annotation-list-view';
import SearchResultListView from '../panel-search-results/search-result-list-view';

import browseItemsTemplate from './browse-items-template';

export default class BrowseItemsView extends CompositeView {
    currentUser: string;
    userAnnotationList: AnnotationListView;
    resultsList: SearchResultListView;

    async initialize() {
        this.currentUser = ldChannel.request('current-user-uri');
        const sparqlItems = new ItemGraph();
        const query = nodesByUserQuery(this.currentUser, {});
        await sparqlItems.sparqlQuery(query, 'item/query');
        // this.userAnnotationList = new AnnotationListView({
        //     model: query, 
        //     collection: new FlatItemCollection(sparqlItems),
        //     selectable: true });
        this.resultsList = new SearchResultListView({
            model: query,
            collection: new FlatItemCollection(sparqlItems),
            selectable: false }).render();
        this.render();
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }
}
extend(BrowseItemsView.prototype, {
    template: browseItemsTemplate,
    className: 'browse explorer-panel',
    subviews: [
        {
            view: 'resultsList',
            selector: '.user-results'
        },
    ]
});