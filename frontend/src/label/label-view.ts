import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';

import View from '../core/view';
import { rdfs, skos } from '../common-rdf/ns';
import FlatItem from '../common-adapters/flat-item-model';
import attachTooltip from '../tooltip/tooltip-view';

type TooltipSetting = false | 'top' | 'bottom' | 'left' | 'right';

export interface ViewOptions extends BaseOpt<FlatItem> {
    toolTipSetting?: TooltipSetting;
}

export default class LabelView extends View<FlatItem> {
    toolTipSetting: TooltipSetting;

    constructor(options?: ViewOptions) {
        super(options);

        this.toolTipSetting = 'right';
        if (options && options.toolTipSetting !== undefined) {
            this.toolTipSetting = options.toolTipSetting;
        }
        this.model.when('classLabel', this.processClass, this);
    }

    processClass() {
        this.addTooltip();
        this.render();
    }

    render(): this {
        this.$el.text(this.model.get('classLabel'));
        this.$el.addClass(this.model.get('cssClass'));
        return this;
    }

    addTooltip(): void {
        if (typeof this.toolTipSetting === 'string') {
            attachTooltip(this, {
                direction: this.toolTipSetting,
                model: this.model,
            });
        }
    }
}

extend(LabelView.prototype, {
    tagName: 'span',
    className: 'tag',
});
