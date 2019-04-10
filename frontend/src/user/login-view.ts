import { extend } from 'lodash';

import View from '../core/view';
import loginTemplate from './login-template';

export default class LoginForm extends View {
    render() {
        this.$el.html(this.template({}));
        return this;
    }
    submit(event?: JQuery.TriggeredEvent) {
        if (event) event.preventDefault();
        let username = this.$('input[name="username"]').val(),
            password = this.$('input[name="password"]').val();
        return this.trigger('submit', {username, password});
    }
    cancel() {
        return this.trigger('cancel');
    }
    reset() {
        this.$('form').get(0).reset();
        return this;
    }
}

extend(LoginForm.prototype, {
    className: 'modal is-active',
    template: loginTemplate,
    events: {
        'click .modal-background, .modal-close': 'reset',  // triggers cancel
        reset: 'cancel',
        submit: 'submit',
    },
});
