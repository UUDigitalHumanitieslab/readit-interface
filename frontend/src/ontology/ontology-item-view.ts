
import { timeStamp } from 'console';
import { extend } from 'lodash';

import LabelView from '../label/label-view';

export default class OntologyItemView extends LabelView {
    initialize() {
        this.listenTo(this.model, {
            focus: this.select,
            blur: this.unSelect,
        });
    }

    select(): this {
        this.$el.addClass('is-highlighted');
        return this;
    }

    unSelect(): this {
        this.$el.removeClass('is-highlighted');
        return this;
    }

    onClick(): this {
        const event = this.$el.hasClass('is-highlighted') ? 'blur' : 'focus';
        this.model.trigger(event, this.model);
        return this;
    }

}
extend(LabelView.prototype, {
    tagName: 'span',
    className: 'tag',
    events: {
        'click': 'onClick',
    }
});
