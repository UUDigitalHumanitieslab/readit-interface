import { extend } from 'lodash';

import explorerChannel from '../explorer/explorer-radio';
import { CompositeView } from '../core/view';
import Graph from '../common-rdf/graph';
import Model from '../core/model';

import SourceListView from './source-list-view';
import SourceListPanelTemplate from './source-list-panel-template';
import PaginationView from '../pagination/pagination-view';

export default class SourceListPanel extends CompositeView {
    sourceListView: SourceListView;
    paginationView: PaginationView;
    totalPages: Number;
    sources: Graph;
    query: string;
    queryfields: string;

    initialize() {
        this.query = this.model.get('query');
        this.queryfields = this.model.get('fields');
        this.initSourceList();
        this.fetchResultsCount().once('sync', this.initPagination, this);
    }

    initSourceList() {
        this.sources = new Graph();
        this.sources.fetch({
            url: '/source/search',
            data: $.param({ query: this.query, fields: this.queryfields}),
        });
        this.sourceListView = new SourceListView({collection: this.sources, model: this.model});
        this.listenTo(this.sourceListView, 'source:clicked', this.onSourceClicked);
    }

    fetchResultsCount(): Model {
        const resultsCount = new Model();
        resultsCount.fetch({
            url: 'source/results_count',
            data: $.param(this.model.toJSON())
        });
        return resultsCount;
    }

    initPagination(resultsCount: Model) {
        this.totalPages = Math.ceil(resultsCount.get('total_results') / resultsCount.get('results_per_page'));
        this.paginationView = new PaginationView({totalPages: this.totalPages});
        this.listenTo(this.paginationView, 'pagination:set', this.fetchMoreSources);
        this.render();
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