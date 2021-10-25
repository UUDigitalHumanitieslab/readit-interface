import { extend } from 'lodash';

import Node from "../common-rdf/node";
import { CompositeView } from "../core/view";
import TypeAwareHelpText from "../item-edit/type-aware-help-view";

import dateFieldTemplate from './date-field-template';

export default class DateField extends CompositeView {
    helpText: TypeAwareHelpText;

    initialize() {
        this.helpText = new TypeAwareHelpText({model: this.model['node'] as Node});
        this.render();
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    updateHelpText(event: JQueryEventObject) {
        const value = $(event.currentTarget).val() as string;
        this.helpText.updateHelpText(value);
    }
}
extend(DateField.prototype, {
    template: dateFieldTemplate,
    subviews: [{
        view: 'helpText', selector: '.date', method: 'append'
    },
    ],
    events: {
        'keyup .input': 'updateHelpText'
    }
});