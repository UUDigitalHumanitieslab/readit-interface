import { extend } from 'lodash';

import { CompositeView } from '../core/view';
import LabelView from '../label/label-view';
import FlatItem from '../common-adapters/flat-item-model';

export default class OntologyClassPickerItemView extends CompositeView<FlatItem> {
    labelView: LabelView;

    initialize(): this {
        this.labelView = new LabelView({
            model: this.model,
            toolTipSetting: false,
        });
        this.listenTo(this.model, { 'focus': this.onFocus, 'blur': this.onBlur });
        return this.render();
    }

    onClick(event: Event): this {
        this.trigger('click', this.model);
        return this;
    }

    onHover(event: Event): this {
        this.trigger('hover', this.model);
        return this;
    }

    onFocus() {
        this.$el.addClass('is-active');
    }

    onBlur() {
        this.$el.removeClass('is-active');
    }
}
extend(OntologyClassPickerItemView.prototype, {
    tagName: 'a',
    className: 'dropdown-item',
    subviews: ['labelView'],
    events: {
        'mousedown': 'onClick',
        'mouseenter': 'onHover'
    }
});
