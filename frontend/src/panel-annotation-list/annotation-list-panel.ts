import { extend } from 'lodash';

import { baseUrl } from 'config.json';

import explorerChannel from '../explorer/explorer-radio';
import FlatItem from '../common-adapters/flat-item-model';

import AnnotationListView from './annotation-list-view';
import annotationListPanelTemplate from './annotation-list-view';
import ItemGraph from '../common-adapters/item-graph';
import Graph from '../common-rdf/graph';

export default class AnnotationListPanel extends AnnotationListView {

    renderContainer(): this {
        this.$el.html(this.template(this));
        this.summaryList = this.$(this.container);
        this.$('.header').addClass('panel-header');
        this.$('.title').removeClass('is-3').addClass('is-4')
        this.$('.header').prepend(`
        <button class="button is-small rdf-export" type=button>
            <span class="icon is-small">
                <i class="fas fa-file-export"></i>
            </span>
        </button>
        `)
        this.$('.summary-list').addClass('panel-content');
        return this;
    }

    _handleFocus(model: FlatItem): void {
        this.scrollTo(model);
        explorerChannel.trigger('annotationList:showAnnotation', this, model);
    }

    exportAnnotations(): void {
        const items = new ItemGraph();
        items.query({ object: this.model, traverse: 1, revTraverse: 1, download: true }).then(
        function error() {
            console.debug(error);
        });
    }
}

extend(AnnotationListPanel.prototype, {
    className: 'annotation-list explorer-panel',
    events: {
        'click .rdf-export': 'exportAnnotations'
    }
});