import { extend } from 'lodash';
import Model from '../core/model';
import View, { CompositeView, ViewOptions as BaseOpt } from '../core/view';
import Graph from '../jsonld/graph';
import welcomeTemplate from './welcome-template';

export interface ViewOptions extends BaseOpt {
    searchBox: View;
}

export default class WelcomeView extends CompositeView {
    searchboxView: View;

    constructor(options: ViewOptions) {
        super(options);
        this.searchboxView = options.searchBox;
        this.render();
        this.searchboxView.on("searchClicked", this.search, this);
    }

    renderContainer() {
        this.$el.html(this.template(this));
        return this;
    }

    async search(query: string, queryfields: string = 'all') {
        const sources = new Graph();
        const resultsCount = new Model();
        await resultsCount.fetch({ 
            url: 'source/results_count',
            data: $.param({ query, queryfields })
        });
        if (resultsCount.get('value') !== 0) {
            await sources.fetch({
                url: '/source/search',
                data: $.param({ query, queryfields}),
            });
        }
        
        this.trigger('search:searched', resultsCount, sources, query, queryfields);
    }
}

extend(WelcomeView.prototype, {
    tagName: 'section',
    template: welcomeTemplate,
    subviews: [{
        view: 'searchboxView',
        selector: '.welcome-image',
    }],
});

export type SearchResult = {
    id: number,
    highlight: any,
};
