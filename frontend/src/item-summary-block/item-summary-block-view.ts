import { extend } from 'lodash';
import { ViewOptions as BViewOptions } from 'backbone';

import View from '../core/view';
import Subject from '../common-rdf/subject';
import FlatItem from '../common-adapters/flat-item-model';

import itemSummaryBlockTemplate from './item-summary-block-template';

export interface ViewOptions extends BViewOptions {
    // The model is required. It should be either an annotation that has an item
    // body or just a bare item. In the first case, it should preferably be a
    // flattened annotation, but it also works with a bare Subject.
    model: FlatItem | Subject;
}

/**
 * Present an item (optionally as part of an annotation) as a colored block
 * with focus/blur interaction. This view is self-rendering.
 */
export default class ItemSummaryBlockView extends View {
    model: FlatItem;
    setClasses: string[];

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions) {
        if (this.model instanceof Subject) {
            this.model = new FlatItem(this.model);
        }
        this.setClasses = [];
        if (this.model['complete']) {
            this._startListening();
        } else {
            this.listenToOnce(this.model, 'complete', this._startListening);
        }
    }

    _startListening(): void {
        this.render().listenTo(this.model, {
            change: this.render,
            focus: this.select,
            blur: this.unSelect,
        });
    }

    render(): this {
        this.$el.html(this.template(this.prepareData()));
        this.$el.removeClass(this.setClasses);
        this.$el.addClass(this.setClasses = this.model.getFilterClasses());
        return this;
    }

    prepareData() {
        let { text, classLabel, label } = this.model.attributes;
        if (text) {
            const words = text.trim().split(/\s+/g);
            if (words.length > 6) {
                words.splice(3, words.length - 6, '…');
                text = words.join(' ');
            }
        }
        return { text, classLabel, label };
    }

    select(): this {
        this.$el.addClass('is-highlighted');
        return this;
    }

    unSelect(): this {
        this.$el.removeClass('is-highlighted');
        return this;
    }

    getTop(): number {
        return this.$el.offset().top;
    }

    getHeight(): number {
        return this.$el.outerHeight();
    }

    onClick(): this {
        const event = this.$el.hasClass('is-highlighted') ? 'blur' : 'focus';
        this.model.trigger(event, this.model);
        this.trigger('click', this, this.model);
        return this;
    }

    onHover(): this {
        this.trigger('hover', this, this.model);
        return this;
    }

    onHoverEnd(): this {
        this.trigger('hoverEnd', this, this.model);
        return this;
    }
}

extend(ItemSummaryBlockView.prototype, {
    tagName: 'span',
    className: 'item-sum-block',
    template: itemSummaryBlockTemplate,
    events: {
        'click': 'onClick',
        'hover': 'onHover',
        'hoverEnd': 'onHoverEnd'
    }
});
