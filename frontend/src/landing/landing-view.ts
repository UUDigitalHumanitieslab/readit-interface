import { extend } from 'lodash';
import ItemGraph from '../common-adapters/item-graph';

import View from "../core/view";
import ldChannel from '../common-rdf/radio';
import userChannel from '../common-user/user-radio';

import landingTemplate from './landing-template';

export default class LandingView extends View {
    totalSources: number;
    totalItems: number;
    sources: ItemGraph;
    items: ItemGraph;
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
        const itemList = await ldChannel.request('promise:item-list');
        this.totalItems = itemList.length;
        const sourceList = await ldChannel.request('promise:source-list');
        this.totalSources = sourceList.length;
        this.render();
    }

    async requestUserNodes() {
        this.items = await ldChannel.request('promise:user-items');
        this.userItems = this.items.length;
        this.sources = await ldChannel.request('promise:user-sources');
        this.userSources = this.sources.length;
        this.render();
    }
}

extend(LandingView.prototype, {
    tagName: 'section',
    className: 'section welcome',
    template: landingTemplate,
});
