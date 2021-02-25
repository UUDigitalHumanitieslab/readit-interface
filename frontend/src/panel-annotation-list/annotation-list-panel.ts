import { extend } from 'lodash';

import { baseUrl } from 'config.json';

import explorerChannel from '../explorer/explorer-radio';
import FlatItem from '../common-adapters/flat-item-model';
import ItemGraph from '../common-adapters/item-graph';
import CompositeView from '../core/view';

import annotationListPanelTemplate from './annotation-list-panel-template';
import AnnotationListView from './annotation-list-view';
import HeaderView from '../panel-header/panel-header-view';

export default class AnnotationListPanel extends CompositeView<FlatItem> {
    header: HeaderView;
    annotationList: AnnotationListView;

    initialize(): void {
        const downloadLink = baseUrl + 'item/?o=' + this.model.id + '&t=1&r=1'; 
        const headerInfo = {
            title: 'Annotations',
            downloadLink: downloadLink
        }
        this.header = new HeaderView({model: headerInfo});
        this.annotationList = new AnnotationListView({
            collection: this.collection,
            model: this.model
        })
        this.render();
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }
}

extend(AnnotationListPanel.prototype, {
    className: 'annotation-list explorer-panel',
    template: annotationListPanelTemplate,
    subviews: [{
        view: 'header',
        selector: '.panel-header'
    },
    {
        view: 'annotationList',
        selector: '.panel-content'
    }],
    events: {
        'click .rdf-export': 'exportAnnotations'
    }
});