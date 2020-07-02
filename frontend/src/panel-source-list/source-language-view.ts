import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from '../core/view';

import { schema, iso6391, UNKNOWN } from '../jsonld/ns';

import Graph from '../jsonld/graph';

import sourceLanguageTemplate from './source-language-template';

export default class SourceLanguageView extends View {
    language: string;
    sources: any;

    initialize(): this {
        this.language = this.model.get('language');
        this.collection = this.model.get('sources');
        this.render().listenTo(this.collection, 'update reset', this.render);
        return this;
    }

    vocabularizeLanguage(inputLanguage: string): string {
        if (inputLanguage == "other") {
            return UNKNOWN;
        }
        return iso6391(inputLanguage);
    }

    render(): this {
        this.sources = this.collection.map( source => ({
            name: source.get(schema('name'))[0],
            author: source.get(schema.creator)[0],
            cid: source.cid
        }));
        if (this.sources.length > 0) {
            this.$el.html(this.template(this));
        }
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
