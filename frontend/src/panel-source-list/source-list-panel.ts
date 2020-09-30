import SourceListView from './source-list-view';

export default class SourceListPanel extends SourceListView {

    renderContainer(): this {
        this.$el.html(this.template(this));
        this.$('.header').addClass('panel-header');
        this.$('.source-summary').addClass('panel-content');
        return this;
    }
}
SourceListPanel.prototype.className = 'source-list explorer-panel'
