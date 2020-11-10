import { extend } from 'lodash';

import explorerChannel from '../explorer/radio';
import { CompositeView, ViewOptions as BaseOpt } from '../core/view';
import Graph from '../jsonld/graph';
import Model from '../core/model';

import SourceListView from './source-list-view';
import SourceListPanelTemplate from './source-list-panel-template';
import PaginationView from '../pagination/pagination-view';

export interface ViewOptions extends BaseOpt {
    collection: Graph;
    model: Model;
    resultsCount: Model;
}

export default class SourceListPanel extends CompositeView {
    sourceListView: SourceListView;
    paginationView: PaginationView;
    totalPages: Number;

    constructor(options?: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions) {
        this.sourceListView = new SourceListView({collection: options.collection, model: options.model});
        this.totalPages = Math.ceil(options.resultsCount.get('total_results') / options.resultsCount.get('results_per_page'));
        this.paginationView = new PaginationView({totalPages: this.totalPages});
    }

    // subviews() {
    //     if (this.totalPages > 1) {
    //         return [this.sourceListView, this.paginationView];
    //     } else return [this.sourceListView];
    // }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    onSourceClicked(sourceCid: string): this {
        explorerChannel.trigger('source-list:click', this, this.collection.get(sourceCid));
        return this;
    }
}

extend(SourceListPanel.prototype, {
    className: 'source-list explorer-panel',
    template: SourceListPanelTemplate,
    subviews: [{
        view: 'sourceListView',
        selector: '.panel-content'}
    // }, {
    //     view: 'paginationView',
    //     selector: '.panel-footer',
    // }]
    ]
});