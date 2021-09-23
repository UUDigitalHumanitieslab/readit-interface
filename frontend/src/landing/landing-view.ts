import { extend } from 'lodash';
import ItemGraph from '../common-adapters/item-graph';

import View from "../core/view";
import { nodesByUserQuery } from '../sparql/compile-query';
import ldChannel from '../common-rdf/radio';

import sourceList from '../global/source-list';
import itemList from '../global/item-list';

import landingTemplate from './landing-template';
import { Collection } from 'backbone';

export default class LandingView extends View {
    totalSources: number;
    totalItems: number;
    userSources: number;
    userItems: number;

    initialize() {
        this.listenTo(itemList, 'sync', () => this.setLength(itemList, this.totalItems));
        this.listenTo(sourceList, 'sync', () => this.setLength(sourceList, this.totalSources));
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

    setLength(nodeList: Collection, nItems: number) {
        nItems = nodeList.length;
        this.render();
    }
}

extend(LandingView.prototype, {
    tagName: 'section',
    template: landingTemplate,
});
