import { extend } from 'lodash';

import View from '../core/view';
import itemTemplate from './search-result-ld-item-template';

export default class ItemView extends View {
    render() {
        this.$el.html(this.template({}));
        return this;
    }
    open(event: JQuery.TriggeredEvent) {
        this.trigger('open');
    }
}

extend(ItemView.prototype, {
    tagName: 'article',
    className: 'box searchresult-resultbox',
    template: itemTemplate,
    events: {
        click: 'open',
    },
});
