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
    collection: Graph;

    initialize() {
        this.initSourceList();
        this.fetchResultsCount().once('sync', this.initPagination, this);
    }

    initSourceList() {
        this.collection = new Graph();
        this.collection.fetch({
            url: '/source/search',
            data: $.param(this.model.toJSON()),
        });
        this.sourceListView = new SourceListView({collection: this.collection, model: this.model});
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
        const totalPages = Math.ceil(resultsCount.get('total_results') / resultsCount.get('results_per_page'));
        this.paginationView = new PaginationView({ totalPages });
        this.listenTo(this.paginationView, 'pagination:set', this.fetchMoreSources);
        this.render();
    }

    fetchMoreSources(page: number) {
        this.collection.fetch({
            url: '/source/search',
            data: $.param({ ...this.model.toJSON(), page })
        })
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
    subviews: [{
        view: 'sourceListView',
        selector: '.panel-content'
    }, {
        view: 'paginationView',
        selector: '.panel-footer',
    }],
});