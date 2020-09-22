import { ViewOptions as BaseOpt, Model } from 'backbone';
import { extend } from 'lodash';

import { CollectionView } from '../core/view';
import Graph from '../jsonld/graph';
import Node from '../jsonld/node';
import { dcterms, vocab } from '../jsonld/ns';
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
        if (this.collection.length) {
            this.collection.comparator = this.sortByRelevance;
            this.collection.sort();
        }
        else this.collection.comparator = this.sortByDate;
        this.noResults = this.model && !this.collection.length;
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

    sortByRelevance(model): number {
        const score = model.get(vocab['relevance'])[0].slice(0);
        return -parseFloat(score);
    }

    sortByDate(model): number {
        return -model.get(dcterms.created)[0].getTime();
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
