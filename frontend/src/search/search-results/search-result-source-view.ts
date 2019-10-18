import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';

import searchResultSourceTemplate from './search-result-source-template';

import { schema } from './../../jsonld/ns';
import ldChannel from './../../jsonld/radio';
import Node from '../../jsonld/node';
import LabelView from '../../utilities/label-view';
import SnippetView from '../../utilities/snippet-view/snippet-view';
import BaseAnnotationView from '../../annotation/base-annotation-view';

export interface ViewOptions extends BaseOpt<Node> {
    model: Node;
}

export default class SearchResultSourceView extends BaseAnnotationView {
    snippetView: SnippetView;
    labelView: LabelView;
    title: string;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.listenTo(this, 'textQuoteSelector', this.processTextQuoteSelector);
        this.listenTo(this, 'source', this.baseProcessSource);

        this.baseProcessModel(this.model);
        this.listenTo(this.model, 'change', this.baseProcessModel);
        return this;
    }

    baseProcessSource(source: Node): this {
        this.title = source.get(schema('name'))[0] as string;
        let sourceOntologyInstance = ldChannel.request('obtain', source.get('@type')[0] as string);
        if (!this.labelView) {
            this.labelView = new LabelView({ model: sourceOntologyInstance });
            this.labelView.render();
        }
        return this;
    }

    processTextQuoteSelector(selector: Node): this {
        if (this.snippetView) return;
            this.snippetView = new SnippetView({
                title: this.title,
                selector: selector
            });
        this.snippetView.render();
        return this;
    }

    render(): this {
        if (this.snippetView) this.snippetView.$el.detach();
        if (this.labelView) this.labelView.$el.detach();
        this.$el.html(this.template(this));

        if (this.snippetView) this.$('.snippet-container').append(this.snippetView.el);
        if (this.labelView) this.$('.label-container').append(this.labelView.el);
        return this;
    }
}
extend(SearchResultSourceView.prototype, {
    tagName: 'div',
    className: 'search-result-source',
    template: searchResultSourceTemplate,
    events: {
    }
});
