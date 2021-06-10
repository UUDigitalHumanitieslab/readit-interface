import { extend } from 'lodash';

import Model from '../core/model';
import { CollectionView, ViewOptions as BaseOpt } from '../core/view';
import Graph from '../common-rdf/graph';
import Node from '../common-rdf/node';
import { dcterms, vocab } from '../common-rdf/ns';
import { announceRoute } from '../explorer/utilities';

import sourceListTemplate from './source-list-template';
import SourceSummaryView from './source-summary-view';
import LoadingSpinnerView from '../loading-spinner/loading-spinner-view';

const announce = announceRoute('explore');

export interface ViewOptions extends BaseOpt {
    collection: Graph;
    model?: Model;
}

export default class SourceListView extends CollectionView<Model, SourceSummaryView> {
    noResults = false;
    loadingSpinnerView: LoadingSpinnerView;

    constructor(options?: ViewOptions) {
        super(options);
    }

    initialize(): this {
        if (this.model) {
            this.collection.comparator = this.sortByRelevance;
            this.collection.sort();
        }
        else this.collection.comparator = this.sortByDate;
        this.initItems().render().initCollectionEvents();
        this.initializeLoadingSpinner();
        this.listenToOnce(this.collection, 'sync', this.renderSourceList);
        this.on('announceRoute', announce);
        return this;
    }

    makeItem(model: Node): SourceSummaryView {
        const query = this.model ? this.model.get('query') : undefined;
        const fields = this.model ? this.model.get('fields') : undefined;
        let view = new SourceSummaryView({ model, query, fields });
        this.listenTo(view, 'click', this.onSourceClicked);
        return view;
    }

    initializeLoadingSpinner() {
        this.loadingSpinnerView = new LoadingSpinnerView().render();
        this.$el.append(this.loadingSpinnerView.$el);
        this.loadingSpinnerView.activate();
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    renderSourceList() {
        this._hideLoadingSpinner();
        if (!this.collection.length) {
            this.noResults = true;
        }
        this.render();
    }

    onSourceClicked(sourceCid: string): this {
        this.trigger('source:clicked', this.collection.get(sourceCid));
        return this;
    }

    sortByRelevance(model): number {
        const score = model.get(vocab['relevance'])[0].slice(0);
        return -parseFloat(score);
    }

    sortByDate(model): number {
        return -model.get(dcterms.created)[0].getTime();
    }

    _hideLoadingSpinner(): void {
        if (this.loadingSpinnerView) {
            this.loadingSpinnerView.remove();
            delete this.loadingSpinnerView;
        }
    }
}
extend(SourceListView.prototype, {
    tagName: 'div',
    className: 'source-list',
    template: sourceListTemplate,
    events: {

    },
    container: '.source-summary'
});
