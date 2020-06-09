import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import { CollectionView } from '../core/view';

import Graph from '../jsonld/graph';
import Node from '../jsonld/node';
import { schema, iso6391, UNKNOWN } from '../jsonld/ns';

import sourceListTemplate from './source-list-template';
import SourceLanguageView from './source-language-view';
import { cpus } from 'os';
import Collection from '../core/collection';

const languages = ["en", "fr", "de", "other"];

export interface ViewOptions extends BaseOpt<Node> {
    collection: Graph;
}

export default class SourceListView extends CollectionView<Node, SourceLanguageView> {
    unorderedSources: Graph;

    constructor(options?: ViewOptions) {
        super(options);
    }

    initialize(): this {
        this.processCollection(this.collection as Graph, languages);
        this.initItems().render().initCollectionEvents();
        return this;
    }

    processCollection(collection: Graph, languages: string[]): this {
        console.log(collection);
        this.collection = new Graph(languages.map(lang => {
            let sources = [];
            if (collection.models.length > 1) {
                sources = collection.filter( (item: Node) => {
                    let inLanguage = item.get(schema.inLanguage)[0] as Node;
                    return inLanguage.id == this.vocabularizeLanguage(lang);
                })
            }
            return new Node({
                language: lang,
                sources: sources
            })
        }));
        return this;
    }

    vocabularizeLanguage(inputLanguage: string): string {
        if (inputLanguage == "other") {
            return UNKNOWN;
        }
        return iso6391(inputLanguage);
    }

    makeItem(model: Node): SourceLanguageView {
        let view = new SourceLanguageView({model});
        return view;
    }

    resetItems(): this {
        this.processCollection(this.collection as Graph, languages);
        console.log(this.collection);
        this.clearItems().initItems().placeItems().render();
        return this;
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
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
    },
    container: '.sources-per-language'
});
