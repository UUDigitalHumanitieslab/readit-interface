import { extend } from 'lodash';

import View from '../core/view';

import PaginationTemplate from './pagination-template';

export default class PaginationView extends View {

    initialize() {
        this.render();
    }

    render(): this {
        this.$el.html(this.template(this));
        return this;
    }
}

extend(PaginationView.prototype, {
    className: 'pagination',
    template: PaginationTemplate
});