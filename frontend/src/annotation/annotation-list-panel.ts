import AnnotationListView from './annotation-list-view';

export default class AnnotationListPanel extends AnnotationListView {

    renderContainer(): this {
        this.$el.html(this.template(this));
        this.summaryList = this.$(this.container);
        this.$('.header').addClass('panel-header');
        this.$('.summary-list').addClass('panel-content');
        return this;
    }
}
AnnotationListPanel.prototype.className = 'annotation-list explorer-panel'