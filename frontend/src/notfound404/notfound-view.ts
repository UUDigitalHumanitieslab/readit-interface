import { extend } from 'lodash';

import View from '../core/view';

import notFoundTemplate from './notfound-template';

export default class NotFoundView extends View {
    render(): this {
        this.$el.html(this.template(this));
        return this;
    }
}

extend(NotFoundView.prototype, {
    tagName: 'section',
    className: 'welcome',
    template: notFoundTemplate,
});
