import { extend } from 'lodash';
import { ViewOptions as BaseOpt } from 'backbone';

import View from '../core/view';
import Node from '../jsonld/node';
import { schema } from '../jsonld/ns';
import sourceSummaryTemplate from './source-summary-template';

export interface ViewOptions extends BaseOpt<Node> {
    model: Node;
}

export default class SourceSummaryView extends View {
    name: string;
    author: string;
    cid: string;

    initialize(): this {
        this.name = this.model.get(schema('name'))[0];
        this.author = this.model.get(schema.creator)[0];
        this.cid = this.model.cid;
        this.render();
        return this;
    }

    render(): this {
        this.$el.html(this.template(this));
        return this;
    }

    onSourceClicked(): this {
        this.trigger('click', this.cid);
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
