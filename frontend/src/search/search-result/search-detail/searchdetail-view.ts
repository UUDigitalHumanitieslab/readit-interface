import { extend } from 'lodash';

import View from '../../../core/view';
import searchDetailTemplate from './searchdetail-template';

export default class SearchDetailView extends View {

    render() {
        this.$el.html(this.template(this));
        return this;
    }

    initialize() {
    }


}

extend(SearchDetailView.prototype, {
    tagName: 'div',
    className: 'searchdetail',
    template: searchDetailTemplate,
    events: {
    }
});
