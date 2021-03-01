import { extend } from 'lodash';

import { baseUrl } from 'config.json';

import explorerChannel from '../explorer/explorer-radio';
import FlatItem from '../common-adapters/flat-item-model';
import ItemGraph from '../common-adapters/item-graph';
import { CompositeView } from '../core/view';
import { announceRoute } from '../explorer/utilities';
import { getScrollTop, animatedScroll, ScrollType } from '../utilities/scrolling-utilities';

import annotationListPanelTemplate from './annotation-list-panel-template';
import AnnotationListView from './annotation-list-view';
import HeaderView from '../panel-header/panel-header-view';

const itemUrl = baseUrl + 'item/'
const announce = announceRoute('source:annotated', ['model', 'id']);

export default class AnnotationListPanel extends CompositeView<FlatItem> {
    header: HeaderView;
    annotationList: AnnotationListView;
    downloadLink: string;

    initialize(): void {
        this.downloadLink = itemUrl + 'download?o=' + this.model.id + '&t=1&r=1'; 
        this.header = new HeaderView({ model: { title: 'Annotations' } });
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
        explorerChannel.trigger('annotationList:showAnnotation', this, annotation);
    }

    closeAnnotation(annotation: FlatItem): void {
        explorerChannel.trigger('annotationList:hideAnnotation', this, annotation);
    }
}

extend(AnnotationListPanel.prototype, {
    className: 'annotation-panel explorer-panel',
    template: annotationListPanelTemplate,
    subviews: [{
        view: 'header',
        selector: '.panel-header'
    },
    {
        view: 'annotationList',
        selector: '.panel-content'
    }]
});