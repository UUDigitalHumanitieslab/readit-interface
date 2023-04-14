import { timingSafeEqual } from 'crypto';
import { extend } from 'lodash';
import { ViewOptions as BaseOptions } from 'backbone';

import Node from "../common-rdf/node";
import { CompositeView } from "../core/view";
import TypeAwareHelpText from "../item-edit/type-aware-help-view";

import dateFieldTemplate from './date-field-template';

interface DateFieldOptions extends BaseOptions {
    model: Node;
    name: string;
    label: string;
    additionalHelpText?: string;
    readonly?: boolean;
    required?: boolean;
}

export default class DateField extends CompositeView<Node> {
    helpText: TypeAwareHelpText;
    name: string;
    label: string;
    additionalHelpText: string;
    required: boolean;
    readonly: boolean;

    initialize(options: DateFieldOptions) {
        this.name = options.name;
        this.label = options.label;
        this.helpText = new TypeAwareHelpText({model: this.model});
        this.additionalHelpText = options.additionalHelpText;
        this.readonly = (options.readonly !== false);
        this.required = (options.required === true);
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
    className: 'field date',
    template: dateFieldTemplate,
    subviews: [{
        view: 'helpText', selector: '.date', method: 'append'
    },
    ],
    events: {
        'keyup .input': 'updateHelpText'
    }
});