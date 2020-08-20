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
import SourceLanguageView from './source-language-view';

const announce = announceRoute('explore');
const languages = ["en", "fr", "de", "other"];

export interface ViewOptions extends BaseOpt<Node> {
    collection: Graph;
}

export default class SourceListView extends CollectionView<Model, SourceLanguageView> {
    unorderedSources: Graph;

    constructor(options?: ViewOptions) {
        super(options);
    }

    initialize(): this {
        this.processCollection(this.collection as Graph, languages);
        this.initItems().on('announceRoute', announce);
        return this;
    }

    processCollection(collection: Graph, languages: string[]): this {
        this.unorderedSources = collection;
        this.collection = new Collection(languages.map(lang => {
            let sources = new FilteredCollection(collection, (item: Node) => {
                let inLanguage = item.get(schema.inLanguage)[0] as Node;
                return inLanguage.id == this.vocabularizeLanguage(lang);
            });
            return new Model({
                language: lang,
                sources: sources
            });
        }));
        return this;
    }

    vocabularizeLanguage(inputLanguage: string): string {
        if (inputLanguage == "other") {
            return UNKNOWN;
        }
        return iso6391(inputLanguage);
    }

    makeItem(model: Model): SourceLanguageView {
        let view = new SourceLanguageView({model});
        this.listenTo(view, 'click', this.onSourceClicked);
        return view;
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    onSourceClicked(sourceCid: string): this {
        explorerChannel.trigger('source-list:click', this, this.unorderedSources.get(sourceCid));
        return this;
    }
}
extend(SourceListView.prototype, {
    tagName: 'div',
    className: 'source-list explorer-panel',
    template: sourceListTemplate,
    events: {
    },
    container: '.sources-per-language'
});
