import { extend } from 'lodash';
import View from './../core/view';

import Node from './../jsonld/node';
import { getCssClassName, getLabel } from './utilities';

export default class LabelView extends View {
    label: string;
    cssClassName: string;

    constructor(node: Node) {
        super();
        this.label = getLabel(node);
        this.cssClassName = getCssClassName(node);
    }
    
    render(): View {
        this.$el.html();
        this.$el.text(this.label);
        this.$el.addClass(this.cssClassName);
        return this;
    }
}
extend(LabelView.prototype, {
    tagName: 'span',
    className: 'tag'
});