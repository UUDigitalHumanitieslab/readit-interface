import { extend } from 'lodash';

import View from '../core/view';
import panelHeaderTemplate from './panel-header-template';

export default class HeaderView extends View {
    title: string;
    downloadLink: string;

    initialize() {
        this.title = this.model['title'];
        this.render();
    }

    render(): this {
        this.$el.html(this.template(this));
        return this;
    }
}

extend(HeaderView.prototype, {
    template: panelHeaderTemplate
});
