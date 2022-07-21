import { extend } from 'lodash';
import View from '../core/view';

import registrationTemplate from './registration-template';

export default class RegistrationFormView extends View {
    isSuccess: boolean;
    hasError: boolean;

    render(): this {
        this.$el.html(this.template(this));
        this.$("form").validate({
            errorClass: "help is-danger",
            rules: {
                email: {
                    required: true,
                    email: true,
                },
                password1: "required",
                password2: {
                    equalTo: "#password",
                },
            },
        });
        return this;
    }

    submit(event?: JQuery.TriggeredEvent): this {
        if (event) event.preventDefault();
        if (this.$('form').valid()) this.trigger('register', {
            username: this.$('input[name="username"]').val(),
            password1: this.$('input[name="password1"]').val(),
            password2: this.$('input[name="password2"]').val(),
            email: this.$('input[name="email"]').val(),
        });
        return this;
    }

    invalid(errors: any): this {
        var validator = this.$( 'form' ).validate();
        validator.showErrors(errors);
        return this;
    }

    error(response: any): this {
        this.hasError = true;
        this.render();
        console.error(response);
        return this;
    }

    success(): this {
        this.isSuccess = true;
        this.render();
        return this;
    }
}
extend(RegistrationFormView.prototype, {
    className: 'modal is-active',
    events: {
        submit: 'submit',
    },
    template: registrationTemplate
});
