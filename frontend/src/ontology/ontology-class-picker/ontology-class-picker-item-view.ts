import { extend, sortBy } from 'lodash';

import { CompositeView } from '../../core/view';
import Node from '../../jsonld/node';
import LabelView from './../label-view';

export default class OntologyClassPickerItemView extends CompositeView<Node> {
    labelView: LabelView;

    initialize(): this {
        this.labelView = new LabelView({
            model: this.model,
            toolTipSetting: false
        }).render();
        return this.render();
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
    subviews: ['labelView'],
    events: {
        'mousedown': 'onClick',
    }
});
