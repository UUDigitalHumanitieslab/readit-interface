import { extend } from 'lodash';
import * as _ from 'underscore';
import View from '../core/view';
import Collection from '../core/collection';

import annotateTemplate from './annotate-template';

export default class SearchView extends View {
    render(): View {
        this.$el.html(this.template(this));

        return this;
    }
}
extend(SearchView.prototype, {
    tagName: 'div',
    className: 'section',
    template: annotateTemplate,
    events: {
    }
});
