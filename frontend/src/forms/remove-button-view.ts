import { extend } from 'lodash';

import View from '../core/view';

import removeButtonTemplate from './remove-button-template';

export default class RemoveButton extends View {
    initialize(): void {
        this.render();
    }

    render(): this {
        this.$el.html(this.template({}));
        return this;
    }

    onClick(): void {
        this.trigger('click', this);
    }
}

extend(RemoveButton.prototype, {
    className: 'control',
    template: removeButtonTemplate,
    events: {
        click: 'onClick',
    },
});
