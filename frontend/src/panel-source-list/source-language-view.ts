import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from '../core/view';

import { schema, iso6391, UNKNOWN } from '../jsonld/ns';

import Graph from '../jsonld/graph';
import Node from '../jsonld/node';

import sourceLanguageTemplate from './source-language-template';

export default class SourceLanguageView extends View<Node> {
    language: string;
    sources: any;

    initialize(): this {
        this.language = this.model.attributes.language;
        this.sources = this.model.attributes.sources.map( source => {
            return {
                name: source.get(schema('name'))[0],
                author: source.get(schema.creator)[0],
                cid: source.cid
        }});
        if (this.sources.length > 0) {
            this.render();
        }
        return this;
    }

    vocabularizeLanguage(inputLanguage: string): string {
        if (inputLanguage == "other") {
            return UNKNOWN;
        }
        return iso6391(inputLanguage);
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
