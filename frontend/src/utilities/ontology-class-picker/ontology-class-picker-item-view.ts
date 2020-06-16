import { extend, sortBy } from 'lodash';

import View from '../../core/view';
import Node from '../../jsonld/node';
import  LabelView from './../label-view';

export default class OntologyClassPickerItemView extends View<Node> {
    labelView: LabelView;

    initialize(): this {
        this.labelView = new LabelView({
            model: this.model,
            toolTipSetting: false
        });
        return this;
    }

    render(): this {
        this.labelView.$el.detach();
        this.labelView.render().$el.appendTo(this.$el);
        return this;
    }

    activate(): this {
        this.$el.addClass('is-active');
        this.trigger('activated', this);
        return this;
    }

    deactivate(): this {
        this.$el.removeClass('is-active');
        this.trigger('deactivated', this);
        return this;
    }

    onClick(event: any): this {
        this.trigger('click', this);
        return this;
    }
}
extend(OntologyClassPickerItemView.prototype, {
    tagName: 'a',
    className: 'dropdown-item',
    events: {
        'mousedown': 'onClick',
    }
});
