import { extend } from 'lodash';
import View from './../core/view';

import Node from './../jsonld/node';
import { getCssClassName, getLabel } from './utilities';

export default class LabelView extends View {
    label: string;
    cssClassName: string;

    render(): View {
        let label = getLabel(<Node>this.model);
        let className = getCssClassName(<Node>this.model);

        this.$el.html();
        this.$el.text(label);
        this.$el.addClass(className);
        return this;
    }
}
extend(LabelView.prototype, {
    tagName: 'span',
    className: 'tag'
});
