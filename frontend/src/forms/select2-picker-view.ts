import { extend } from 'lodash';
import 'select2';

import BasePicker from './base-picker-view';

/**
 * A very thin wrapper around `BasePicker` that enables the select2 plugin.
 */
export default class Select2PickerView extends BasePicker {
    beforeRender(): this {
        this.$('select').select2('destroy');
        return this;
    }

    afterRender(): this {
        this.$('select').select2();
        return this;
    }

    remove(): this {
        this.$('select').select2('destroy');
        return super.remove();
    }
}

extend(Select2PickerView.prototype, {
    className: 'readit-picker',
});
