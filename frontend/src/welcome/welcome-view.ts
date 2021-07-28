import { extend } from 'lodash';
import { $ } from 'backbone';

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
        this.$('.tabs li[data-tab="searchboxView"]').addClass('is-active');
        this.semSearchView.$el.hide();
        this.searchboxView.on('all', this.trigger, this);
        this.semSearchView.on('all', this.trigger, this);
    }

    renderContainer() {
        this.$el.html(this.template(this));
        return this;
    }

    toggleTab(event): void {
        this[
            this.$('.tabs li.is-active').removeClass('is-active').data('tab')
        ].$el.hide();
        this[
            $(event.currentTarget).addClass('is-active').data('tab')
        ].$el.show();
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
    events: {
        'click .tabs li': 'toggleTab',
    },
});

export type SearchResult = {
    id: number,
    highlight: any,
};
