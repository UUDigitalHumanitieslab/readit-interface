import { extend } from 'lodash';

import View from '../core/view';
import footerTemplate from './footer-template';

export default class FooterView extends View {
    render() {
        this.$el.html(this.template({}));
        return this;
    }
}

extend(FooterView.prototype, {
    tagName: 'div',
    className: 'container',
    template: footerTemplate,
});