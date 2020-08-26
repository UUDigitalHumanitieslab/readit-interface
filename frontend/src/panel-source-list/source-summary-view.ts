import { extend } from 'lodash';

import View from '../core/view';
import { schema } from '../jsonld/ns';
import sourceSummaryTemplate from './source-summary-template';

export default class SourceSummaryView extends View {
    name: string;
    author: string;
    cid: string;

    initialize(): this {
        this.name = this.model.get(schema('name'))[0];
        this.author = this.model.get(schema.creator)[0];
        this.cid = this.model.cid;
        console.log(this.name);
        this.render(); //.listenTo(this.collection, 'update reset', this.render);
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
    className: 'source-language',
    template: sourceSummaryTemplate,
    events: {
        'click .card': 'onSourceClicked'
    }
});
