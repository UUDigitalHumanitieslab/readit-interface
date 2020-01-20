import { extend } from 'lodash';
import View from './../../core/view';

import registrationTemplate from './registration-template';

export default class RegistrationFormView extends View {

    render(): this {
        this.$el.html(this.template({}));
        return this;
    }
}
extend(RegistrationFormView.prototype, {
    tagName: 'form',
    className: 'registration-form section page',
    template: registrationTemplate
});
