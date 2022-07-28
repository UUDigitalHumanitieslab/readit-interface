import { extend, debounce } from 'lodash';
import View from '../core/view';

export default class InputField extends View {
    initialize(): void {
        this.forwardKeyup = debounce(this.forwardKeyup, 500);
    }

    forwardChange(event) {
        this.trigger('change', this, this.$el.val(), event);
    }

    forwardKeyup(event) {
        this.trigger('keyup', this, this.$el.val(), event);
    }

    onKeyup(event) {
        // Why bind this event to a method that just calls another method?
        // Because binding forwardKeyup directly would not debounce,
        // and because binding the event in initialize will stop working
        // in case client code re-delegates the events.
        this.forwardKeyup(event);
    }

    setValue(value: string) {
        this.$el.val(value);
        this.render();
    }

    getValue(): string {
        return this.$el.val() as string;
    }
}
extend(InputField.prototype, {
    tagName: 'input',
    className: 'input',
    events: {
        change: 'forwardChange',
        keyup: 'onKeyup',
    },
});
