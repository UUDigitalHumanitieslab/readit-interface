import { extend } from 'lodash';
import Model from '../core/model';
import View from '../core/view';
import Graph from '../jsonld/graph';
import { ViewOptions as BaseOpt } from 'backbone';
import welcomeTemplate from './welcome-template';

export interface ViewOptions extends BaseOpt<Model> {
    searchBox: View;
}

export default class WelcomeView extends View {
    searchboxView: View;

    constructor(options: ViewOptions) {
        super(options);
        this.searchboxView = options.searchBox;
    }

    render() {
        this.$el.html(this.template(this));

        this.$('.welcome-image').append(this.searchboxView.render().$el);
        this.searchboxView.on("searchClicked", this.search);

        return this;
    }

    async search(query: string, queryfields: string = 'all') {
        const sources = new Graph();
        await sources.fetch({ url: '/source/search', data: $.param({ query: query, queryfields: queryfields})  });
        this.trigger('search:searched', sources, query, queryfields);
    }
}

extend(WelcomeView.prototype, {
    tagName: 'section',
    template: welcomeTemplate
});

export type SearchResult = {
    id: number,
    highlight: any,

}