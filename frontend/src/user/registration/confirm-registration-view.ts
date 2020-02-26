import { extend } from 'lodash';
import View from './../../core/view';

import user from './../../global/user';
import confirmRegistrationTemplate from './confirm-registration-template';

export default class RegistrationFormView extends View {

    render(): this {
        this.$el.html(this.template({}));
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
    tagName: 'section',
    className: 'section',
    template: confirmRegistrationTemplate
});

