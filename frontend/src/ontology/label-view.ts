import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from '../core/view';

import { skos } from '../jsonld/ns';
import Node from '../jsonld/node';
import { getCssClassName, getLabel } from '../utilities/utilities';

type TooltipSetting = false | 'top' | 'bottom' | 'left' | 'right';

export interface ViewOptions extends BaseOpt<Node> {
    toolTipSetting?: TooltipSetting;
}

export default class LabelView extends View<Node> {
    label: string;
    cssClassName: string;
    toolTipSetting: TooltipSetting;

    constructor(options?: ViewOptions) {
        super(options);

        this.toolTipSetting = 'top';
        if (options && options.toolTipSetting !== undefined) {
            this.toolTipSetting = options.toolTipSetting;
        }
        this.render().listenTo(this.model, 'change', this.render);
    }

    render(): this {
        let label = getLabel(this.model);
        let className = getCssClassName(this.model);
        this.$el.html();
        this.$el.text(label);
        this.$el.addClass(className);
        this.addDefinition();

        return this;
    }

    addDefinition(): void {
        if (this.hasTooltip() && this.model.has(skos.definition)) {
            this.$el.addClass("tooltip");
            this.$el.addClass("is-tooltip");
            this.setTooltipOrientation();

            let definition = this.model.get(skos.definition)[0] as string;
            this.$el.attr("data-tooltip", definition);

            if (definition.length > 65) {
                this.$el.addClass("is-tooltip-multiline");
            }
        }
    }

    hasTooltip(): boolean {
        return typeof this.toolTipSetting === 'string';
    }

    onClick() {
        this.model.trigger('focus', this, this.model);
    }

    setTooltipOrientation(): this {
        let orientation = `-${this.toolTipSetting}`;
        this.$el.addClass(`is-tooltip${orientation}`);
        return this;
    }
}
extend(LabelView.prototype, {
    tagName: 'span',
    className: 'tag',
    events: {
        click: 'onClick'
    }
});
