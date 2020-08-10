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
    sources: SearchResult[];

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

    search(query: string, queryfields: string = 'all') {
        const sources = new Graph();
        sources.fetch({ url: '/source/search/', data: $.param({ query: query, queryfields: queryfields})  }).then( bla => {
            console.log('fetch!');
        })
    }
}

extend(WelcomeView.prototype, {
    tagName: 'section',
    template: welcomeTemplate
});

export type SearchResult = {
    text: string,
    language: string,
    id: number,
    score: number,

}