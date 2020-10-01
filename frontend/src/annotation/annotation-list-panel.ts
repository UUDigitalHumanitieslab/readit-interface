import explorerChannel from '../explorer/radio';
import FlatModel from './flat-annotation-model';

import AnnotationListView from './annotation-list-view';

export default class AnnotationListPanel extends AnnotationListView {

    renderContainer(): this {
        this.$el.html(this.template(this));
        this.summaryList = this.$(this.container);
        this.$('.header').addClass('panel-header');
        this.$('.summary-list').addClass('panel-content');
        this.$('.title').removeClass('is-4').addClass('.is-3');
        return this;
    }

    _handleFocus(model: FlatModel): void {
        this.scrollTo(model);
        explorerChannel.trigger('annotationList:showAnnotation', this, model);
    }
}
AnnotationListPanel.prototype.className = 'annotation-list explorer-panel'