import { ViewOptions as BaseOpt, View as BView } from 'backbone';
import { extend } from 'lodash';

import View from '../core/view';

export type Direction = 'top' | 'bottom' | 'left' | 'right';

export interface ViewOptions extends BaseOpt {
    direction?: Direction;
}

const oppositeDirection = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
};

const cssPropsToCopy = [
    'border-bottom-width',
    'border-left-width',
    'border-right-width',
    'border-top-width',
    'box-sizing',
    'margin-bottom',
    'margin-left',
    'margin-right',
    'margin-top',
    'padding-bottom',
    'padding-left',
    'padding-right',
    'padding-top',
];

/**
 * A simple, empty, transparent view with the sole purpose of having a Bulma
 * tooltip associated. It is not really meant to be used directly; rather, you
 * should layer it over another view using the `attachTooltip` function below.
 *
 * The `model` should have `text` attribute, which will be inserted in the
 * tooltip. To use the (localized) `skos:definition` or `rdfs:comment` from a
 * `FlatItem`, adapt it through the `toTooltip` helper function first. This is
 * the default export of `./tooltip-model`.
 */
export class Tooltip extends View {
    preferredDirection: string;
    direction: string;

    constructor(options?: ViewOptions) {
        super(options);
        this.preferredDirection = options && options.direction || 'right';
        this.model.when('text', this.render, this);
    }

    render(): this {
        const text = this.model.get('text');
        this.$el.attr('data-tooltip', text);
        this.$el.addClass('tooltip');
        return this;
    }

    show(): this {
        this.$el.addClass(`is-tooltip-active is-tooltip-${this.direction}`);
        return this;
    }

    hide(): this {
        this.$el.removeClass(`is-tooltip-active is-tooltip-${this.direction}`);
        return this;
    }

    positionTo<V extends BView<any>>(view: V, selector: string): this {
        const other = selector ? view.$(selector) : view.$el;
        const offset = other.offset();
        const width = other.width();
        const height = other.height();
        this.$el.css(other.css(cssPropsToCopy))
            .width(width).height(height).offset(offset);
        const direction = this.direction = this.preferredDirection;
        const viewport = window['visualViewport'];
        if (viewport) {
            const distance = (
                direction === 'top' ? offset.top - viewport.offsetTop :
                direction === 'left' ? offset.left - viewport.offsetLeft :
                direction === 'right' ? (viewport.offsetLeft + viewport.width) - (offset.left + width) :
                (viewport.offsetTop + viewport.height) - (offset.top + height)
            );
            if (distance < 400) this.direction = oppositeDirection[direction];
        }
        return this;
    }
}

extend(Tooltip.prototype, {
    className: 'rit-tooltip is-tooltip-multiline',
});

/**
 * Attach a `Tooltip` to the given `view`. The tooltip view will be a direct
 * child of the `<body>` element in order to ensure that the tooltip balloon is
 * never obscured by the overflow edges of containing elements. Events are
 * taken care of and the tooltip is `.remove`d automatically when `view` is.
 */
export default function attachTooltip<V extends BView<any>>(
    view: V, options: ViewOptions, selector: string = ''
): Tooltip {
    const tooltip = new Tooltip(options);
    tooltip.$el.appendTo(document.body);
    const openTooltip = () => tooltip.positionTo(view, selector).show();
    function attachEvents() {
        view.delegate('mouseenter', selector, openTooltip);
        view.delegate('mouseleave', selector, tooltip.hide.bind(tooltip));
    }
    attachEvents();
    const { remove, setElement } = view;
    extend(view, {
        remove() {
            tooltip.remove();
            return remove.call(view);
        },
        setElement(element) {
            const result = setElement.call(view, element);
            attachEvents();
            return result;
        },
    });
    return tooltip;
}
