import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from '../core/view';

import { skos } from './../jsonld/ns';
import Node from '../jsonld/node';
import { getCssClassName, getLabel } from './utilities';

export interface ViewOptions extends BaseOpt<Node> {
    /**
     * Specifies if the tooltip is shown. Defaults to true and is shown at the top of the label.
     */
    hasTooltip?: boolean;
    /**
     * Specifies if the tooltip is shown on the right of the label.
     */
    hasTooltipRight?: boolean;
    /**
     * Specifies if the tooltip is shown in the bottom of the label.
     */
    hasTooltipBottom?: boolean;
    /**
     * Specifies if the tooltip is shown on the left of the label.
     */
    hasTooltipLeft?: boolean;
}

export default class LabelView extends View<Node> {
    label: string;
    cssClassName: string;
    hasTooltipTop: boolean;
    hasTooltipLeft: boolean;
    hasTooltipBottom: boolean;
    hasTooltipRight: boolean;

    constructor(options?: ViewOptions) {
        super(options);

        if (options) {
            if (options.hasTooltipRight !== undefined) {
                this.hasTooltipRight = options.hasTooltipRight;
            }
            else if (options.hasTooltipBottom !== undefined) {
                this.hasTooltipBottom = options.hasTooltipBottom;
            }
            else if (options.hasTooltipLeft !== undefined) {
                this.hasTooltipLeft = options.hasTooltipLeft;
            }
            else if (options.hasTooltip !== undefined) {
                this.hasTooltipTop = options.hasTooltip;
            }
            else {
                this.hasTooltipTop = true;
            }
        } else {
            this.hasTooltipTop = true;
        }
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
        return this.hasTooltipTop || this.hasTooltipRight || this.hasTooltipBottom || this.hasTooltipLeft;
    }

    setTooltipOrientation(): this {
        let orientation = "";
        if (this.hasTooltipRight) orientation = "-right";
        if (this.hasTooltipBottom) orientation = "-bottom";
        if (this.hasTooltipLeft) orientation = "-left";
        this.$el.addClass(`is-tooltip${orientation}`);
        return this;
    }
}
extend(LabelView.prototype, {
    tagName: 'span',
    className: 'tag',
});
