import { extend, ListIterator } from 'lodash';

import { baseUrl } from 'config.json';

import Model from '../core/model';
import Collection from '../core/collection';
import View, { CompositeView } from '../core/view';
import explorerChannel from '../explorer/explorer-radio';
import FlatItem from '../common-adapters/flat-item-model';
import { announceRoute } from '../explorer/utilities';

import annotationListPanelTemplate from './annotation-list-panel-template';
import AnnotationListView from './annotation-list-view';
import createFilterView from './filter-view';

const itemUrl = baseUrl + 'item/'
const announce = announceRoute('source:annotated', ['model', 'id']);

export default class AnnotationListPanel extends CompositeView<FlatItem> {
    hidden: Collection;
    filterView: View;
    annotationList: AnnotationListView;
    downloadLink: string;

    initialize(): void {
        this.downloadLink = itemUrl + 'download?o=' + this.model.id + '&t=1&r=1';
        this.annotationList = new AnnotationListView({
            collection: this.collection,
            model: this.model
        });
        const filter = createFilterView();
        this.filterView = filter.view;
        this.hidden = filter.hidden;
        this.listenTo(this.collection, {
            focus: this.openAnnotation,
            blur: this.closeAnnotation,
        });
        this.listenTo(this.hidden, 'update', this.broadcastSettings);
        this.broadcastSettings();
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

    broadcastSettings(): void {
        const settings = this.hidden.map('cssClass' as unknown as ListIterator<Model, string>);
        this.collection.trigger('filter:exclude', settings);
    }

    toggleFilterView(): void {
        this.$('.filter-panel').toggle();
    }
}

extend(AnnotationListPanel.prototype, {
    className: 'annotation-panel explorer-panel',
    template: annotationListPanelTemplate,
    subviews: [{
        view: 'filterView',
        selector: '.filter-panel .panel-content',
    }, {
        view: 'annotationList',
        selector: '.annotation-list',
    }],
    events: {
        'click button.filter, .filter-panel .btn-close': 'toggleFilterView',
    },
});
