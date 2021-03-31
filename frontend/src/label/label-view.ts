import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from '../core/view';

import { skos } from '../common-rdf/ns';
import Node from '../common-rdf/node';
import { getCssClassName, getLabel } from '../utilities/linked-data-utilities';
import FlatItem from '../common-adapters/flat-item-model';

type TooltipSetting = false | 'top' | 'bottom' | 'left' | 'right';

export interface ViewOptions extends BaseOpt<FlatItem> {
    toolTipSetting?: TooltipSetting;
}

export default class LabelView extends View<FlatItem> {
    label: string;
    cssClassName: string;
    toolTipSetting: TooltipSetting;

    constructor(options?: ViewOptions) {
        super(options);

        this.toolTipSetting = 'top';
        if (options && options.toolTipSetting !== undefined) {
            this.toolTipSetting = options.toolTipSetting;
        }
        this.model.when('class', this.processClass, this);
    }

    processClass() {
        this.label = this.model.get('classLabel');
        this.cssClassName = this.model.get('cssClass');
        this.addDefinition();
        this.render();
    }

    render(): this {
        this.$el.html();
        this.$el.text(this.label);
        this.$el.addClass(this.cssClassName);
        return this;
    }

    addDefinition(): void {
        if (this.hasTooltip() && this.model.get('class').has(skos.definition)) {
            this.$el.addClass("tooltip");
            this.$el.addClass("is-tooltip");
            this.setTooltipOrientation();

            let definition = this.model.get('class').get(skos.definition)[0] as string;
            this.$el.attr("data-tooltip", definition);

            if (definition.length > 65) {
                this.$el.addClass("is-tooltip-multiline");
            }
        }
    }

    hasTooltip(): boolean {
        return typeof this.toolTipSetting === 'string';
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
});
