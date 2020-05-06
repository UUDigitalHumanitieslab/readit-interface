import { extend } from 'lodash';

import View from '../core/view';
import FlatAnnotation from '../annotation/flat-annotation-model';
import itemTemplate from './overlap-item-template';

export default class OverlapItemView extends View<FlatAnnotation> {
    initialize() {
        this.render().listenTo(this.model, {
            focus: this.focus,
            blur: this.blur,
        });
    }

    render(): this {
        this.$el.html(this.template(this.model.attributes));
        return this;
    }

    focus() {
        this.$el.addClass('is-selected');
    }

    blur() {
        this.$el.removeClass('is-selected');
    }

    onClick() {
        this.model.trigger('focus', this.model);
    }
}

extend(OverlapItemView.prototype, {
    tagName: 'li',
    template: itemTemplate,
    events: {
        click: 'onClick',
    },
});