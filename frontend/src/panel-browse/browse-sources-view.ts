import { extend } from 'lodash';

import { CompositeView } from "../core/view";
import ItemGraph from "../common-adapters/item-graph";


import ldChannel from '../common-rdf/radio';
import explorerChannel from '../explorer/explorer-radio';
import { sourcesByUserQuery } from "../sparql/compile-query";

import browseTemplate from './browse-template';
import SourceListView from "../panel-source-list/source-list-view";


export default class BrowseSourcesView extends CompositeView {
    currentUser: string;
    resultsList: SourceListView;
    title = 'Sources'

    async initialize() {
        this.currentUser = ldChannel.request('current-user-uri');
        const sparqlItems = new ItemGraph();
        const query = sourcesByUserQuery(this.currentUser, {});
        const sourceGraph = 'source/query';
        await sparqlItems.sparqlQuery(query, sourceGraph);
        this.resultsList = new SourceListView({
            collection: sparqlItems
        }).render();        
        this.listenTo(
            this.resultsList, 'source:clicked', this.onSourceClicked
        );
        this.render();
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    onSourceClicked(model: Node): this {
        explorerChannel.trigger('source-list:click', this, model);
        return this;
    }
}
extend(BrowseSourcesView.prototype, {
    template: browseTemplate,
    className: 'browse explorer-panel',
    subviews: [
        {
            view: 'resultsList',
            selector: '.user-results'
        },
    ]
});