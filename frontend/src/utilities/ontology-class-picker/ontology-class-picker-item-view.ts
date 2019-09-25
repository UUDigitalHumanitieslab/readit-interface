import { ViewOptions as BaseOpt } from 'backbone';
import { extend, sortBy } from 'lodash';
import View from '../../core/view';

import Node from '../../jsonld/node';
import  LabelView from './../label-view';

export interface ViewOptions extends BaseOpt<Node> {
    model: Node;
}

export default class OntologyClassPickerItemView extends View<Node> {
    labelView: LabelView;

    initialize(options: ViewOptions): this {
        this.labelView = new LabelView({ model: options.model });
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
