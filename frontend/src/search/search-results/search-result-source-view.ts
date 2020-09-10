import { extend } from 'lodash';

import { CompositeView } from '../../core/view';
import { schema } from '../../jsonld/ns';
import ldChannel from '../../jsonld/radio';
import Node from '../../jsonld/node';
import FlatItem from '../../annotation/flat-item-model';
import LabelView from '../../utilities/label-view';
import SnippetView from '../../utilities/snippet-view/snippet-view';
import BaseAnnotationView from '../../annotation/base-annotation-view';

import searchResultSourceTemplate from './search-result-source-template';

export default class SearchResultSourceView extends CompositeView<FlatItem> {
    snippet: SnippetView;
    label: LabelView;
    title: string;

    initialize(options): this {
        this.snippet = new SnippetView({ model: this.model });
        this.model.when('source', this.processSource, this);
        return this;
    }

    processSource(model: FlatItem, source: Node): this {
        this.title = source.get(schema('name'))[0] as string;
        this.snippet.title = this.title;
        let sourceType = ldChannel.request('obtain', source.get('@type')[0] as string);
        this.label = new LabelView({ model: sourceType }).render();
        return this.render();
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    activate(): this {
        this.snippet.activate();
        return this;
    }
}

extend(SearchResultSourceView.prototype, {
    tagName: 'div',
    className: 'search-result-source',
    template: searchResultSourceTemplate,
    subviews: [{
        view: 'snippet',
        selector: '.snippet-container',
    }, {
        view: 'label',
        selector: '.label-container',
    }],
});
