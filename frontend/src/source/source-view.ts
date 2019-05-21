import { extend } from 'lodash';
import View from './../core/view';

import sourceTemplate from './source-template';

export default class SourceView extends View {

    render() {
        this.$el.html(this.template(this));
        return this;
    }
}
extend(SourceView.prototype, {
    tagName: 'div',
    className: 'source',
    template: sourceTemplate,
    events: {
    }
});
