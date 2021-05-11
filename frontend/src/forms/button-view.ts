import { extend } from 'lodash';

import View from '../core/view';

/**
 * This class only defines the abstract behavior of a button.
 * Override it with a `.template` in order to set the presentation.
 */
export default class Button extends View {
    initialize(): void {
        this.render();
    }

    render(): this {
        this.$el.html(this.template(this));
        return this;
    }

    onClick(): void {
        this.trigger('click', this);
    }
}

extend(Button.prototype, {
    className: 'control',
    events: {
        click: 'onClick',
    },
});
