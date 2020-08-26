import { ViewOptions as BaseOpt, Model } from 'backbone';
import { extend } from 'lodash';

import { CollectionView } from '../core/view';
import Collection from '../core/collection';
import Graph from '../jsonld/graph';
import Node from '../jsonld/node';
import { schema, iso6391, UNKNOWN } from '../jsonld/ns';
import FilteredCollection from '../utilities/filtered-collection';
import explorerChannel from '../explorer/radio';
import { announceRoute } from '../explorer/utilities';

import sourceListTemplate from './source-list-template';
import SourceSummaryView from './source-summary-view';

const announce = announceRoute('explore');

export interface ViewOptions extends BaseOpt<Node> {
    collection: Graph;
}

export default class SourceListView extends CollectionView<Node, SourceSummaryView> {

    constructor(options?: ViewOptions) {
        super(options);
    }

    initialize(): this {
        this.initItems().on('announceRoute', announce);
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
