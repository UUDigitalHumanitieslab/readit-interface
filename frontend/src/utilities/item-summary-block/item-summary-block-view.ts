import { once, includes, extend } from 'lodash';
import { ViewOptions as BViewOptions } from 'backbone';

import Model from '../../core/model';
import View from '../../core/view';
import { oa } from '../../jsonld/ns';
import Node from '../../jsonld/node';
import ldChannel from '../../jsonld/radio';
import FlatModel from '../../annotation/flat-annotation-model';
import { getCssClassName, getLabel } from '../utilities';

import itemSummaryBlockTemplate from './item-summary-block-template';

// Internal function to wrap an item as a surrogate FlatAnnotation so we can
// assume the same attributes when rendering.
function wrapItem(item: Node): Model {
    const cls = ldChannel.request('obtain', item.get('@type')[0] as string);
    return new Model({
        item: item,
        label: getLabel(item),
        class: cls,
        classLabel: getLabel(cls),
        cssClass: getCssClassName(cls),
    });
}

export interface ViewOptions extends BViewOptions {
    // The model is required. It should be either an annotation that has an item
    // body or just a bare item. In the first case, it should preferably be a
    // flattened annotation, but it also works with a bare Node.
    model: FlatModel | Node;
}

/**
 * Present an item (optionally as part of an annotation) as a colored block
 * with focus/blur interaction. This view is self-rendering.
 */
export default class ItemSummaryBlockView extends View {
    setClass: string;
    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        if (this.model instanceof FlatModel) {
            this._renderWhenComplete();
        } else {
            if (this.model.has('@type')) {
                this._wrapModel();
            } else {
                this.listenToOnce(this.model, 'change:@type', this._wrapModel);
            }
        }
        // This is called inside `render` because `render` itself is called when
        // the model is definitive. We want it take effect only once, however.
        this._bindModelEvents = once(this._bindModelEvents);
        return this;
    }

    // Internal method, only appropriate when the model is a flat annotation.
    _renderWhenComplete(): void {
        if (this.model['complete']) {
            this.render();
        } else {
            this.listenToOnce(this.model, 'complete', this.render);
        }
    }

    // Internal method, called once the `@type` is known if `this.model` starts
    // out as a `Node`.
    _wrapModel(): void {
        const type = this.model.get('@type') as string[];
        if (includes(type, oa.Annotation)) {
            this.model = new FlatModel(this.model as Node);
            this._renderWhenComplete();
        } else {
            this.model = wrapItem(this.model as Node);
            this.setClass = this.model.get('cssClass');
            this.render();
        }
    }

    render(): this {
        this.$el.html(this.template(this.model.attributes));
        let currentClass = this.model.get('cssClass');
        if (this.setClass != currentClass) {
            this.$el.removeClass(this.setClass);
        }
        this.$el.addClass(this.model.get('cssClass'));
        this.setClass = currentClass;
        this._bindModelEvents();
        return this;
    }

    _bindModelEvents(): void {
        this.listenTo(this.model, {
            change: this.render,
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
