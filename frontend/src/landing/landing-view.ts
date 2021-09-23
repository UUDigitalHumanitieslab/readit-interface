import { extend } from 'lodash';
import ItemGraph from '../common-adapters/item-graph';

import ldChannel from '../common-rdf/radio';
import View from "../core/view";
import { nodesByUserQuery } from '../sparql/compile-query';

import landingTemplate from './landing-template';

export default class LandingView extends View {
    totalSources: number;
    totalItems: number;
    userSources: number;
    userItems: number;

    initialize() {
        // ldChannel.request('promise:source-list').then( list => this.totalSources = list.length );
        // ldChannel.request('promise:item-list').then( list => this.totalItems = list.length );
        this.requestUserNodes();
        this.render();
    }

    render() {
        this.$el.html(this.template(this));
        return this;
    }

    async requestUserNodes() {
        const userItemsQuery = nodesByUserQuery(true, {});
        const items = new ItemGraph();
        await items.sparqlQuery(userItemsQuery, 'item/query');
        this.userItems = items.length;
        const userSourcesQuery = nodesByUserQuery(false, {});
        const sources = new ItemGraph();
        await sources.sparqlQuery(userSourcesQuery, 'source/query');
        this.userSources = sources.length;
    }
}

extend(LandingView.prototype, {
    tagName: 'section',
    template: landingTemplate,
});
