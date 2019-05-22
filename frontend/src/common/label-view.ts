import { extend } from 'lodash';
import View from './../core/view';

import Node from './../jsonld/node';
import { getCssClassName, getLabel } from './utilities';

export default class LabelView extends View<Node> {
    label: string;
    cssClassName: string;

    render(): this {
        let label = getLabel(this.model);
        let className = getCssClassName(this.model);

        this.$el.html();
        this.$el.text(label);
        this.$el.addClass(className);
        this.$el.addClass("tooltip");
        this.$el.addClass("is-tooltip-right");
        this.$el.addClass("is-tooltip-multiline");
        this.$el.attr("data-tooltip", this.model.get('classDefinition'));
        return this;
    }
}
extend(LabelView.prototype, {
    tagName: 'span',
    className: 'tag tooltip is-tooltip-right is-tooltip-multiline',
});
