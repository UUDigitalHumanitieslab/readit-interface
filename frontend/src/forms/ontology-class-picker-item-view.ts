import { extend, sortBy } from 'lodash';
import { ViewOptions as BaseOpt } from 'backbone';

import { CompositeView } from '../core/view';
import LabelView from '../label/label-view';
import FlatItem from '../common-adapters/flat-item-model';

export interface ViewOptions extends BaseOpt<FlatItem> {
    level: number;
}

export default class OntologyClassPickerItemView extends CompositeView<FlatItem> {
    labelView: LabelView;

    initialize(options: ViewOptions): this {
        const specifyMargin = 'is-level-' + options.level;
        this.$el.addClass(specifyMargin);
        this.labelView = new LabelView({
            model: this.model
        });
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

    onClick(event: Event): this {
        this.trigger('click', this);
        return this;
    }

    onHover(): this {
        this.trigger('hover', this.model);
        return this;
    }
}
extend(OntologyClassPickerItemView.prototype, {
    tagName: 'a',
    className: 'dropdown-item',
    subviews: ['labelView'],
    events: {
        'mousedown': 'onClick',
        'mouseover': 'onHover'
    }
});
