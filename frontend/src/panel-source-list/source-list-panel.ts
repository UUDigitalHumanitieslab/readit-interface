import explorerChannel from '../explorer/radio';

import SourceListView from './source-list-view';

export default class SourceListPanel extends SourceListView {

    renderContainer(): this {
        this.$el.html(this.template(this));
        this.$('.header').addClass('panel-header');
        this.$('.source-summary').addClass('panel-content');
        this.$('.title').removeClass('is-4').addClass('is-3');
        return this;
    }

    onSourceClicked(sourceCid: string): this {
        explorerChannel.trigger('source-list:click', this, this.collection.get(sourceCid));
        return this;
    }
}
SourceListPanel.prototype.className = 'source-list explorer-panel'
