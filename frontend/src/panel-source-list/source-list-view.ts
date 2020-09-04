import { ViewOptions as BaseOpt, Model } from 'backbone';
import { extend } from 'lodash';

import { CollectionView } from '../core/view';
import Graph from '../jsonld/graph';
import Node from '../jsonld/node';
import explorerChannel from '../explorer/radio';
import { announceRoute } from '../explorer/utilities';

import sourceListTemplate from './source-list-template';
import SourceSummaryView from './source-summary-view';

const announce = announceRoute('explore');

export interface ViewOptions extends BaseOpt<Model> {
    collection: Graph;
    model?: Model;
}

export default class SourceListView extends CollectionView<Model, SourceSummaryView> {
    noResults: boolean;

    constructor(options?: ViewOptions) {
        super(options);
    }

    initialize(): this {
        if (this.model && this.collection.length==0) {
            this.noResults = true;
        } else { this.noResults = false; }
        this.initItems().render().initCollectionEvents();
        this.on('announceRoute', announce);
        return this;
    }

    makeItem(model: Node): SourceSummaryView {
        let view = new SourceSummaryView({model});
        this.listenTo(view, 'click', this.onSourceClicked);
        return view;
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
extend(SourceListView.prototype, {
    tagName: 'div',
    className: 'source-list explorer-panel',
    template: sourceListTemplate,
    events: {

    },
    container: '.source-summary'
});
