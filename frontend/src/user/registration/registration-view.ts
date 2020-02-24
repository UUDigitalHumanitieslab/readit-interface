import { extend } from 'lodash';
import View from './../../core/view';

import registrationTemplate from './registration-template';

export default class RegistrationFormView extends View {

    render(): this {
        this.$el.html(this.template({}));
        this.$('form').validate({
            errorClass: "help is-danger",
            rules: {
                password: "required",
                password_again: {
                    equalTo: "#password"
                }
            },
        });
        return this;
    }

    onRegisterClicked(event: JQueryEventObject): this {
        console.log(this.$el.valid());
        return this;
    }
}
extend(RegistrationFormView.prototype, {
    className: 'modal is-active',
    events: {
        'submit': 'onRegisterClicked',
    },
    template: registrationTemplate
});
