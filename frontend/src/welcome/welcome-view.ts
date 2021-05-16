import { extend } from 'lodash';
import Model from '../core/model';
import View, { CompositeView, ViewOptions as BaseOpt } from '../core/view';
import Graph from '../common-rdf/graph';
import welcomeTemplate from './welcome-template';

export interface ViewOptions extends BaseOpt {
    searchBox: View;
    semSearch: View;
}

export default class WelcomeView extends CompositeView {
    searchboxView: View;
    semSearchView: View;

    constructor(options: ViewOptions) {
        super(options);
        this.searchboxView = options.searchBox;
        this.semSearchView = options.semSearch;
        this.render();
        this.searchboxView.on("searchClicked", this.search, this);
    }

    renderContainer() {
        this.$el.html(this.template(this));
        return this;
    }

    search(query: string, fields: string = 'all') {
        this.trigger('search:start', { query, fields });
    }
}

extend(WelcomeView.prototype, {
    tagName: 'section',
    template: welcomeTemplate,
    subviews: [{
        view: 'searchboxView',
        selector: '.welcome-image',
    }, {
        view: 'semSearchView',
        selector: '.welcome-image',
    }],
});

export type SearchResult = {
    id: number,
    highlight: any,
};
