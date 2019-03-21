import { extend } from 'lodash';

import View from '../core/view';
import detailTemplate from './search-result-ld-detail-template';

export default class DetailView extends View {
    render() {
        this.$el.html(this.template({}));
        return this;
    }
    close(event: JQuery.TriggeredEvent) {
        this.trigger('close');
    }
    switchTab(event: JQuery.TriggeredEvent) {
        let tab = this.$(event.currentTarget);
        if (tab.hasClass('is-active')) return;
        this.$('.tab-content').hide();
        this.$('.tab').removeClass('is-active');
        tab.addClass('is-active');
        this.$('#' + tab.attr('value')).show();
    }
}

extend(DetailView.prototype, {
    className: 'searchdetail',
    template: detailTemplate,
    events: {
        'click .delete, .modal-background': 'close',
        'click .tab': 'switchTab',
    },
});
