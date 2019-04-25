import { extend, defaults } from 'lodash';
import * as _ from 'underscore';
import View from '../core/view';

import annoWelcomeTemplate from './annotation-welcome-template';
import SourceCollection from '../models/source-collection';
import AnnotateView from './annotate-view';
import User from '../user/user-model';


export default class AnnotationWelcomeView extends View {
    /**
     * Store list of sources and annotate view in order to switch between them
     */
    currentAnnotateView: AnnotateView;
    list: JQuery<Element>;

    collection: SourceCollection;
    
    render(): View {
        this.$el.html(this.template({ sources: this.collection.toJSON() }));
        this.list = this.$("#list");
        return this;
    }

    initialize(): void {
        this.collection = new SourceCollection();
        this.collectSources();
    }

    collectSources(): void {
        if (this.collection.length > 0) return;
        
        var self = this;
        var annoCollection = new SourceCollection();

        annoCollection.fetch({
            success: function (collection, response, options) {
                self.collection.set(collection.sortBy('name'));
                self.render();
            },
            error: function (collection, response, options) {
                console.error(response);
                return null;
            }
        });
    }

    /**
     * Initialize an AnnotateView, passing it the selected Source
     */
    initAnnotateView(event: any): void {        
        if (this.currentAnnotateView) this.currentAnnotateView.$el.detach();

        let sourceId = $(event.currentTarget).data('source-id');
        let source = this.collection.get(sourceId);
        
        this.list.hide();
        this.currentAnnotateView = new AnnotateView(source, <User>this.model);
        this.currentAnnotateView.render().$el.insertAfter(this.list);
        this.currentAnnotateView.initAnnotationViews();

        let self = this;
        this.currentAnnotateView.on('return', () => {
            self.currentAnnotateView.$el.detach();
            self.render();
        });
    }
}
extend(AnnotationWelcomeView.prototype, {
    tagName: 'div',
    className: 'section',
    template: annoWelcomeTemplate,
    events: {
        'click .initAnnotations': 'initAnnotateView',
    }
});
