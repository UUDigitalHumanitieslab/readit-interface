import { ViewOptions as BaseOpt, View as BView } from 'backbone';
import { extend } from 'lodash';
import * as i18next from 'i18next';

import View from '../core/view';
import FlatItem from '../common-adapters/flat-item-model';
import { rdfs, skos } from '../common-rdf/ns';

type Direction = 'top' | 'bottom' | 'left' | 'right';

export interface ViewOptions extends BaseOpt<FlatItem> {
    direction?: Direction;
}

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

export class Tooltip extends View<FlatItem> {
    constructor(options?: ViewOptions) {
        super(options);
        const direction = options && options.direction || 'right';
        this.$el.addClass(`is-tooltip-${direction}`);
        this.model.when('class', this.render, this);
    }

    render(): this {
        const cls = this.model.get('class');
        const languageOption = { '@language': i18next.language };
        const definition = cls.get(skos.definition, languageOption);
        const comment = definition || cls.get(rdfs.comment, languageOption);
        this.$el.attr(
            'data-tooltip',
            definition && definition[0] || comment && comment[0]
        );
        return this;
    }

    show(): this {
        this.$el.addClass('is-tooltip-active');
        return this;
    }

    hide(): this {
        this.$el.removeClass('is-tooltip-active');
        return this;
    }

    positionTo<V extends BView<any>>(view: V): this {
        const other = view.$el;
        this.$el.css(other.css(cssPropsToCopy))
            .width(other.width())
            .height(other.height())
            .offset(other.offset());
        return this;
    }
}

extend(Tooltip.prototype, {
    className: 'rit-tooltip tooltip is-tooltip-multiline',
});

export default function attachTooltip<V extends BView<any>>(
    view: V, options: ViewOptions
): Tooltip {
    const tooltip = new Tooltip(options);
    tooltip.$el.appendTo(document.body);
    const openTooltip = () => tooltip.positionTo(view).show();
    function attachEvents() {
        view.delegate('mouseenter', '', openTooltip);
        view.delegate('mouseleave', '', tooltip.hide.bind(tooltip));
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
