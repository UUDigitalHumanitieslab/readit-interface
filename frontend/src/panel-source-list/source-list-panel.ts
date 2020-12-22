import { extend } from 'lodash';

import explorerChannel from '../explorer/explorer-radio';
import { CompositeView, ViewOptions as BaseOpt } from '../core/view';
import Graph from '../common-rdf/graph';
import Model from '../core/model';

import SourceListView from './source-list-view';
import SourceListPanelTemplate from './source-list-panel-template';
import PaginationView from '../pagination/pagination-view';

export interface ViewOptions extends BaseOpt {
    resultsCount: Model;
}

export default class SourceListPanel extends CompositeView {
    sourceListView: SourceListView;
    paginationView: PaginationView;
    totalPages: Number;
    sources: Graph;
    query: string;
    queryfields: string;

    constructor(options?: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions) {
        this.initSourceList();
        this.totalPages = Math.ceil(options.resultsCount.get('total_results') / options.resultsCount.get('results_per_page'));
        this.paginationView = new PaginationView({totalPages: this.totalPages});
        this.listenTo(this.paginationView, 'pagination:set', this.fetchMoreSources);
        this.listenTo(this.sourceListView, 'source:clicked', this.onSourceClicked);
    }

    initSourceList() {
        this.sources = new Graph();
        this.query = this.model.get('query');
        this.queryfields = this.model.get('fields');
        this.sources.fetch({
            url: '/source/search',
            data: $.param({ query: this.query, fields: this.queryfields}),
        });
        this.sourceListView = new SourceListView({collection: this.sources, model: this.model});
    }

    fetchMoreSources(page: number) {
        this.sources.fetch({
            url: '/source/search',
            data: $.param({ query: this.query, fields: this.queryfields, page: page })
        })
    }

    subviews() {
        if (this.totalPages > 1) {
            return [{
                    view: 'sourceListView',
                    selector: '.panel-content'
                }, {
                    view: 'paginationView',
                    selector: '.panel-footer',
                }]
        } else return [{
            view: 'sourceListView',
            selector: '.panel-content'
        }];
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

extend(SourceListPanel.prototype, {
    className: 'source-list explorer-panel',
    template: SourceListPanelTemplate,
});