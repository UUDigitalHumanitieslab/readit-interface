import { extend } from 'lodash';
import View from './../core/view';

import sourceTemplate from './source-template';

export default class SourceView extends View {

    render() {
        this.$el.html(this.template(this));

        // TODO: if panel mode
        this.$el.addClass('explorer-panel');

        return this;
    }

    onToolbarItemClicked(event: any) {
        let clickedItem = $(event.currentTarget).data('toolbar');
        this.trigger('toolbarClicked', clickedItem);
    }
}
extend(SourceView.prototype, {
    tagName: 'div',
    className: 'source',
    template: sourceTemplate,
    events: {
        'click .toolbar-item': 'onToolbarItemClicked',
    }
});
