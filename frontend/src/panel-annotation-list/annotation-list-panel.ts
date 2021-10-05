import { extend } from 'lodash';

import { baseUrl } from 'config.json';

import explorerChannel from '../explorer/explorer-radio';
import FlatItem from '../common-adapters/flat-item-model';
import { CompositeView } from '../core/view';
import { announceRoute } from '../explorer/utilities';

import annotationListPanelTemplate from './annotation-list-panel-template';
import AnnotationListView from './annotation-list-view';

const itemUrl = baseUrl + 'item/'
const announce = announceRoute('source:annotated', ['model', 'id']);

export default class AnnotationListPanel extends CompositeView<FlatItem> {
    annotationList: AnnotationListView;
    downloadLink: string;

    initialize(): void {
        this.downloadLink = itemUrl + 'download?o=' + this.model.id + '&t=1&r=1';
        this.annotationList = new AnnotationListView({
            collection: this.collection,
            model: this.model
        });
        this.listenTo(this.annotationList, 'annotation:clicked', this.openAnnotation);
        this.render().on('announceRoute', announce);
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    openAnnotation(annotation: FlatItem): void {
        explorerChannel.trigger('annotationList:showAnnotation', this, annotation, this.collection);
    }

    closeAnnotation(annotation: FlatItem): void {
        explorerChannel.trigger('annotationList:hideAnnotation', this, annotation);
    }
}

extend(AnnotationListPanel.prototype, {
    className: 'annotation-panel explorer-panel',
    template: annotationListPanelTemplate,
    subviews: [{
        view: 'annotationList',
        selector: '.panel-content'
    }],
});
