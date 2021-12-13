import { extend } from 'lodash';
import { ViewOptions as BaseOpt } from 'backbone';

import { baseUrl } from 'config.json';
import View from '../core/view';
import Node from '../common-rdf/node';
import { oa, schema, sourceOntology } from '../common-rdf/ns';
import sourceSummaryTemplate from './source-summary-template';
import Graph from '../common-rdf/graph';

export interface ViewOptions extends BaseOpt<Node> {
    model: Node;
    query?: string;
    fields?: string;
}

const highlightURL = baseUrl + 'source/highlight';

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
        this.name = this.model.get(sourceOntology('title'))[0];
        this.author = this.model.get(sourceOntology('author'))[0];
        this.identifier = this.model.id as string;
        if (this.query !== undefined) {
            this.renderHighlights();
        }
        else this.render();
        return this;
    }

    async renderHighlights() {
        this.highlights = new Graph();
        await this.highlights.fetch({url: highlightURL, data: $.param({ source: this.identifier, query: this.query, fields: this.fields}) });
        const titleNode = this.highlights.models.find(node => node.get(oa.hasTarget)[0]['id'] === sourceOntology('title'));
        if (titleNode) {
            this.name = titleNode.get(oa.hasBody)[0].toString();
        }
        const authorNode = this.highlights.models.find(node => node.has(oa.hasTarget, sourceOntology('author')));
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