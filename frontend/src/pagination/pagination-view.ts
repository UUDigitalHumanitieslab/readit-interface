import { extend } from 'lodash';

import View, {ViewOptions as BaseOpt} from '../core/view';

import PaginationTemplate from './pagination-template';

export interface ViewOptions extends BaseOpt {
    totalPages: Number;
}

export default class PaginationView extends View {
    currentPage: Number;
    totalPages: Number;

    initialize(options: ViewOptions) {
        this.currentPage = 1;
        this.totalPages = options.totalPages;
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