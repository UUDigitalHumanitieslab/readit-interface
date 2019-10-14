import { ViewOptions as BaseOpt } from 'backbone';
import { extend, omit } from 'lodash';
import View from '../core/view';

import { schema } from './../jsonld/ns';

import Graph from '../jsonld/graph';
import Node from '../jsonld/node';

import sourceLanguageTemplate from './source-language-template';

export interface ViewOptions extends BaseOpt<Node> {
    collection: Graph;
    language: string;
}

export default class SourceLanguageView extends View<Node> {
    language: string;
    sources: any;

    constructor(options?: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.language = options.language;
        this.processCollection(options.collection);
        this.listenTo(this.collection, 'change', this.processCollection);
        return this;
    }

    processCollection(collection: Graph): this {
        this.sources = collection
            .map((s: Node) => {
                if (s.get(schema.inLanguage)[0] == this.language) {
                    return {
                        name: s.get(schema.name)[0],
                        author: s.get(schema.creator)[0],
                        cid: s.cid
                    }
                }
            })
            .filter(s => s !== undefined);
        return this;
    }

    render(): this {
        this.$el.html(this.template(this));
        return this;
    }

    onSourceClicked(event: JQueryEventObject): this {
        let sourceCid = $(event.currentTarget).data('source-cid');
        this.trigger('click', sourceCid);
        return this;
    }
}
extend(SourceLanguageView.prototype, {
    tagName: 'div',
    className: 'source-language',
    template: sourceLanguageTemplate,
    events: {
        'click .sources': 'onSourceClicked'
    }
});