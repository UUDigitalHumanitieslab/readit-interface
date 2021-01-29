import { extend } from 'lodash';

import { baseUrl } from 'config.json';
import Model from '../core/model';
import { CompositeView } from '../core/view';
import Graph from '../common-rdf/graph';
import explorerChannel from '../explorer/explorer-radio';
import routePatterns from '../explorer/route-patterns';

import SourceListView from './source-list-view';
import SourceListPanelTemplate from './source-list-panel-template';
import PaginationView from '../pagination/pagination-view';

const searchURL = baseUrl + 'source/search';
const resultsURL = baseUrl + 'source/results_count';
const routePattern = routePatterns['search:results:sources'];

export default class SourceListPanel extends CompositeView {
    sourceListView: SourceListView;
    paginationView: PaginationView;
    collection: Graph;

    initialize() {
        this.initSourceList();
        this.fetchResultsCount().once('sync', this.initPagination, this);
        this.on('announceRoute', this.announceRoute);
    }

    initSourceList() {
        this.collection = new Graph();
        this.collection.fetch({
            url: searchURL,
            data: $.param(this.model.toJSON()),
        });
        this.sourceListView = new SourceListView({collection: this.collection, model: this.model});
        this.listenTo(this.sourceListView, 'source:clicked', this.onSourceClicked);
    }

    fetchResultsCount(): Model {
        const resultsCount = new Model();
        resultsCount.fetch({
            url: resultsURL,
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
            url: searchURL,
            data: $.param({ ...this.model.toJSON(), page })
        })
    }

    announceRoute(): void {
        const route = routePattern.replace(
            '*queryParams', $.param(this.model.toJSON())
        );
        explorerChannel.trigger('currentRoute', route, this);
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