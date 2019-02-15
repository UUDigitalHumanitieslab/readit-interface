import { extend } from 'lodash';

import View from '../core/view';
import welcomeTemplate from './welcome-template';

export default class EnterView extends View {
    template = welcomeTemplate;
    render() {
        this.$el.html(this.template());
        return this;
    }
}

extend(EnterView.prototype, {
    tagName: 'section',
});