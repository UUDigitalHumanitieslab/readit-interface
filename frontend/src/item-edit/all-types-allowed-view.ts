import { extend } from 'lodash';

import View from '../core/view';

import template from './all-types-allowed-template';

export default class AllTypesAllowedHelpText extends View {
    initialize(): void {
        this.render();
    }

    render(): this {
        this.$el.html(this.template({}));
        return this;
    }
}

extend(AllTypesAllowedHelpText.prototype, {
    tagName: 'p',
    className: 'help',
    template,
});
