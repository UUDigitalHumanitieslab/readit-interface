import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from '../core/view';

import Graph from '../jsonld/graph';
import Node from '../jsonld/node';

import sourceListTemplate from './source-list-template';
import SourceLanguageView from './source-language-view';

export interface ViewOptions extends BaseOpt<Node> {
    collection: Graph;
}

export default class SourceListView extends View<Node> {
    subViews: SourceLanguageView[];

    constructor(options?: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.subViews = [];

        const languages = ["English", "French", "German"];

        for (let language of languages) {
            let view = new SourceLanguageView({ collection: options.collection, language: language });
            view.render();
            this.listenTo(view, 'click', this.onSourceClicked);
            this.subViews.push(view);
        }

        return this;
    }

    render(): this {
        if (this.subViews) {
            this.subViews.forEach(sV => {
                sV.$el.detach();
            });
        }

        this.$el.html(this.template(this));

        if (this.subViews) {
            this.subViews.forEach(sV => {
                sV.$el.appendTo('.sources-per-language');
            });
        }
        return this;
    }

    onSourceClicked(sourceCid: string): this {
        this.trigger('source-list:click', this, this.collection.get(sourceCid));
        return this;
    }
}
extend(SourceListView.prototype, {
    tagName: 'div',
    className: 'source-list explorer-panel',
    template: sourceListTemplate,
    events: {
    }
});
