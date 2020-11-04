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
    countResults: Number;
}

export default class SourceListPanel extends CompositeView {
    sourceListView: SourceListView;
    paginationView: PaginationView;

    constructor(options?: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions) {
        this.sourceListView = new SourceListView({collection: options.collection, model: options.model});
        this.paginationView = new PaginationView();
    }

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
        selector: '.panel-content',
    }, {
        view: 'paginationView',
        selector: '.panel-footer',
    }]
});