import { extend } from 'lodash';
import View from '../core/view';

export default class InputField extends View {
    forwardChange(event) {
        this.trigger('change', this, this.el.value, event);
    }

    setValue(value: string) {
        this.$el.val(value);
        this.render();
    }

}
extend(InputField.prototype, {
    tagName: 'input',
    className: 'input',
    events: { change: 'forwardChange' },
});