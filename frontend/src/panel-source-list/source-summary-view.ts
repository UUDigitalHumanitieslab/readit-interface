import { extend } from 'lodash';
import { ViewOptions as BaseOpt } from 'backbone';

import { baseUrl } from 'config.json';
import View from '../core/view';
import Subject from '../common-rdf/subject';
import { dcterms, oa, schema } from '../common-rdf/ns';
import sourceSummaryTemplate from './source-summary-template';
import Graph from '../common-rdf/graph';

export interface ViewOptions extends BaseOpt<Subject> {
    model: Subject;
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
        this.name = this.model.get(schema('name'))[0];
        this.author = this.model.get(schema.author)[0];
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
        const titleSubject = this.highlights.models.find(subject => subject.get(oa.hasTarget)[0]['id']===dcterms.title);
        if (titleSubject) {
            this.name = titleSubject.get(oa.hasBody)[0].toString();
        }
        const authorSubject = this.highlights.models.find(subject => subject.has(oa.hasTarget, schema.author));
        if (authorSubject) {
            this.author = authorSubject.get(oa.hasBody)[0].toString();
        }
        const textSubject = this.highlights.models.find(subject => subject.get(oa.hasTarget)[0]['id']===schema.text);
        if (textSubject) {
            this.snippets = textSubject.get(oa.hasBody).map(snip => snip.toString());
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
