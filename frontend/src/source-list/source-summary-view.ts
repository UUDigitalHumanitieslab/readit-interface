import { extend } from 'lodash';
import { ViewOptions as BaseOpt } from 'backbone';

import View from '../core/view';
import Node from '../core/node';
import { dcterms, oa, schema } from '../core/ns';
import sourceSummaryTemplate from './source-summary-template';
import Graph from '../core/graph';

export interface ViewOptions extends BaseOpt<Node> {
    model: Node;
    query?: string;
    fields?: string;
}


export default class SourceSummaryView extends View {
    name: string;
    author: string;
    query: string;
    fields: string;
    identifier: string;
    highlights: Graph;
    snippets: string[];


    initialize(options: ViewOptions): this {
        this.query = options.query;
        this.fields = options.fields;
        this.name = this.model.get(schema('name'))[0];
        this.author = this.model.get(schema.creator)[0];
        this.identifier = this.model.attributes['@id'];
        if (this.query !== undefined) {
            this.renderHighlights();
        }
        else this.render();
        return this;
    }

    async renderHighlights() {
        this.highlights = new Graph();
        await this.highlights.fetch({url: '/source/highlight', data: $.param({ source: this.identifier, query: this.query, fields: this.fields}) });
        const titleNode = this.highlights.models.find(node => node.get(oa.hasTarget)[0]['id']===dcterms.title);
        if (titleNode) {
            this.name = titleNode.get(oa.hasBody)[0].toString();
        }
        const authorNode = this.highlights.models.find(node => node.has(oa.hasTarget, schema.creator));
        if (authorNode) {
            this.author = authorNode.get(oa.hasBody)[0].toString();
        }
        const textNode = this.highlights.models.find(node => node.get(oa.hasTarget)[0]['id']===schema.text);
        if (textNode) {
            this.snippets = textNode.get(oa.hasBody).map(snip => snip.toString());
        }
        this.render();
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