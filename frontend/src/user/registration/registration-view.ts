import { extend } from 'lodash';
import View from './../../core/view';

import user from './../../global/user';
import registrationTemplate from './registration-template';

export default class RegistrationFormView extends View {

    render(): this {
        this.$el.html(this.template({}));
        this.$('form').validate({
            errorClass: "help is-danger",
            rules: {
                email: {
                    required: true,
                    email: true
                },
                password: "required",
                password_again: {
                    equalTo: "#password"
                }
            },
        });
        return this;
    }

    submit(event?: JQuery.TriggeredEvent): this {
        if (event) event.preventDefault();
        if (this.$('form').valid()) {
            let username = this.$('input[name="username"]').val() as string,
                password1 = this.$('input[name="password1"]').val() as string,
                password2 = this.$('input[name="password2"]').val() as string,
                email = this.$('input[name="email"]').val() as string;
            user.register({ username, password1, password2, email });
        }
        return this;
    }

    invalid(errors: any): this {
        var validator = this.$( 'form' ).validate();
        validator.showErrors(errors);
        return this;
    }

    error(response: any): this {
        // TODO: give user some feedback
        console.error(response);
        return this;
    }

    success(): this {
        // TODO: give user some feedback
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
