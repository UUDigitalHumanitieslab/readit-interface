import 'select2';

import BasePicker from './base-picker-view';

/**
 * A very thin wrapper around `BasePicker` that enables the select2 plugin.
 */
export default class Select2PickerView extends BasePicker {
    beforeRender(): this {
        this.destroySelect();
        return this;
    }

    afterRender(): this {
        this.$('select').select2({ dropdownAutoWidth: true });
        return this;
    }

    destroySelect(): void {
        const select = this.$('select');
        if (select.hasClass('select2-hidden-accessible')) {
            select.select2('destroy');
        }
    }

    remove(): this {
        this.destroySelect();
        return super.remove();
    }

    open(): this {
        this.$('select').select2('open');
        return this;
    }
}
