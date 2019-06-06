import { ViewOptions } from 'backbone';
import { extend } from 'lodash';
import View from '../core/view';

import { skos } from './../jsonld/ns';
import Node from '../jsonld/node';
import { getCssClassName, getLabel, hasProperty } from './utilities';

export default class LabelView extends View<Node> {
    label: string;
    cssClassName: string;
    hasTooltip: boolean;

    constructor(options: ViewOptions<Node>, hasTooltip: boolean = true) {
        super(options);
        this.hasTooltip = hasTooltip;
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
        if (this.hasTooltip && hasProperty(this.model, skos.definition)) {
            this.$el.addClass("tooltip");
            this.$el.addClass("is-tooltip");

            let definition = this.model.get(skos.definition)[0]['@value'];
            this.$el.attr("data-tooltip", definition);

            if (definition.length > 65) {
                this.$el.addClass("is-tooltip-multiline");
            }
        }
    }
}
extend(LabelView.prototype, {
    tagName: 'span',
    className: 'tag',
});
