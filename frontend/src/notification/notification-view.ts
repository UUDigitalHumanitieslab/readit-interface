import { extend } from 'lodash';

import View from '../core/view';
import notificationTemplate from './notification-template';

/**
 * This class only defines the abstract behavior of a button.
 * Override it with a `.template` in order to set the presentation.
 */
export default class Notification extends View {
    notification: string;

    initialize(): void {
        this.notification = this.model['notification'];
        this.render();
    }

    render(): this {
        this.$el.html(this.template(this));
        return this;
    }

    onClose(): void {
        this.remove();
    }
}

extend(Notification.prototype, {
    template: notificationTemplate,
    events: {
        click: 'onClose',
    },
});