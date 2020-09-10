import { extend } from 'lodash';

import { schema } from '../../jsonld/ns';
import ldChannel from '../../jsonld/radio';
import Node from '../../jsonld/node';
import FlatItem from '../../annotation/flat-item-model';
import LabelView from '../../utilities/label-view';
import SnippetView from '../../utilities/snippet-view/snippet-view';
import BaseAnnotationView from '../../annotation/base-annotation-view';

import searchResultSourceTemplate from './search-result-source-template';

export default class SearchResultSourceView extends BaseAnnotationView {
    snippetView: SnippetView;
    labelView: LabelView;
    title: string;

    constructor(options) {
        super(options);
    }

    initialize(options): this {
        this.listenTo(this, 'textQuoteSelector', this.processTextQuoteSelector);
        this.listenTo(this.model, 'change', super.processAnnotation);
        this.listenTo(this, 'source', super.processSource);
        super.processAnnotation(this.model);
        return this;
    }

    processSource(source: Node): this {
        this.title = source.get(schema('name'))[0] as string;
        let sourceOntologyInstance = ldChannel.request('obtain', source.get('@type')[0] as string);
        if (!this.labelView) {
            this.labelView = new LabelView({ model: sourceOntologyInstance });
            this.labelView.render();
        }

        this.render();

        return this;
    }

    processTextQuoteSelector(selector: Node): this {
        if (this.snippetView) return;
        this.snippetView = new SnippetView({
            title: this.title,
            model: new FlatItem(selector),
        });
        this.snippetView.render();
        this.render();
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
