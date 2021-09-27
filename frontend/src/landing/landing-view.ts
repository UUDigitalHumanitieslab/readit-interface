import { extend } from 'lodash';
import ItemGraph from '../common-adapters/item-graph';

import View from "../core/view";
import { nodesByUserQuery } from '../sparql/compile-query';
import ldChannel from '../common-rdf/radio';
import userChannel from '../common-user/user-radio';

import landingTemplate from './landing-template';

export default class LandingView extends View {
    totalSources: number;
    totalItems: number;
    userSources: number;
    userItems: number;
    user: string;

    initialize() {
        userChannel.request('user').then( (user) => {
            this.user = user.get('username');
        })
        this.awaitNodeLists();
        this.requestUserNodes();
    }

    render() {
        this.$el.html(this.template(this));
        return this;
    }

    async awaitNodeLists() {
        const sourceList = await ldChannel.request('source-list:promise');
        this.totalSources = sourceList.length;
        const itemList = await ldChannel.request('item-list:promise');
        this.totalItems = itemList.length;
        this.render();
    }

    async requestUserNodes() {
        const userItemsQuery = await nodesByUserQuery(true, {});
        const items = new ItemGraph();
        await items.sparqlQuery(userItemsQuery, 'item/query');
        this.userItems = items.length;
        const userSourcesQuery = await nodesByUserQuery(false, {});
        const sources = new ItemGraph();
        await sources.sparqlQuery(userSourcesQuery, 'source/query');
        this.userSources = sources.length;
        this.render();
    }
}

extend(LandingView.prototype, {
    tagName: 'section',
    className: 'section welcome',
    template: landingTemplate,
});
