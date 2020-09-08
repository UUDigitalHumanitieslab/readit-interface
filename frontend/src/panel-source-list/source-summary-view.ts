import { extend } from 'lodash';
import { ViewOptions as BaseOpt } from 'backbone';
// import { Model, Collection } from 'backbone';

import Collection from '../core/collection';
import Model from '../core/model';
import View from '../core/view';
import Node from '../jsonld/node';
import { schema } from '../jsonld/ns';
import sourceSummaryTemplate from './source-summary-template';
import SourceSnippetsView from './source-snippets-view';

export interface ViewOptions extends BaseOpt<Node> {
    model: Node;
    query?: string;
}

class Snippet extends Model {
    parse( data: string ){
        return {
            snippet: data
        };
    }
}

class Snippets extends Collection<Snippet>{
    model = Snippet;
}


export default class SourceSummaryView extends View {
    name: string;
    author: string;
    query: string;
    identifier: string;
    snippets: Snippets;


    initialize(options: ViewOptions): this {
        this.query = options.query;
        this.name = this.model.get(schema('name'))[0];
        this.author = this.model.get(schema.creator)[0];
        this.identifier = this.model.attributes['@id'];
        if (this.query !== undefined) {
            this.snippets = new Snippets();
            this.snippets.fetch({url: '/source/highlight', data: $.param({ source: this.identifier, query: this.query}) }).then( results => {
                const sourceSnippets = new SourceSnippetsView({collection: this.snippets});
                sourceSnippets.render().$el.appendTo('.source');
            });
        }
        this.render();
        return this;
    }

    render(): this {
        this.$el.html(this.template(this));
        return this;
    }

    onSourceClicked(): this {
        this.trigger('click', this.model.cid);
        return this;
    }
}
extend(SourceSummaryView.prototype, {
    tagName: 'div',
    className: 'source-summary',
    template: sourceSummaryTemplate,
    events: {
        'click .card': 'onSourceClicked'
    }
});