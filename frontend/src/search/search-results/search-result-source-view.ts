import { extend, after } from 'lodash';

import { CompositeView } from '../../core/view';
import { schema } from '../../jsonld/ns';
import ldChannel from '../../jsonld/radio';
import Node from '../../jsonld/node';
import FlatItem from '../../annotation/flat-item-model';
import LabelView from '../../utilities/label-view';
import SnippetView from '../../utilities/snippet-view/snippet-view';

import searchResultSourceTemplate from './search-result-source-template';

export default class SearchResultSourceView extends CompositeView<FlatItem> {
    snippet: SnippetView;
    label: LabelView;
    delayedRender: () => void;

    initialize(options): this {
        this.snippet = new SnippetView({ model: this.model });
        this.model.when('source', this.processSource, this);
        return this;
    }

    processSource(model: FlatItem, source: Node): void {
        source.when(schema('name'), this.processTitle, this);
        source.when('@type', this.processLabel, this);
        this.delayedRender = after(2, this.render);
    }

    processTitle(source: Node, [title]: string[]): void {
        this.model.set({ title });
        this.delayedRender();
    }

    processLabel(source: Node, [firstType]: string[]): void {
        const sourceType = ldChannel.request('obtain', firstType);
        this.label = new LabelView({ model: sourceType }).render();
        this.delayedRender();
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
