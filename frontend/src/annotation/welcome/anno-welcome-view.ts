import { extend, defaults } from 'lodash';
import * as _ from 'underscore';
import View from '../../core/view';

import annoWelcomeTemplate from './anno-welcome-template';
import SourceCollection from './../../models/source-collection';
import AnnotateView from '../annotate-view';

import Model from './../../core/model';
import User from './../../models/user';

export default class AnnoWelcomeView extends View {
    /**
     * Store list of sources and annotate view in order to switch between them
     */
    currentAnnotateView: AnnotateView;
    list: JQuery<Element>;

    collection: SourceCollection;

    // TODO: remove after user implementation
    currentUser: User = new User({
        id: 1001,
        name: 'Alex Hebing'
    });

    render(): View {
        this.$el.html(this.template({ sources: this.collection.toJSON() }));
        this.list = this.$("#list");
        return this;
    }

    initialize(): void {
        this.collectSources();
        this.collection = new SourceCollection();
    }

    collectSources(): void {
        var self = this;
        var annoCollection = new SourceCollection();

        annoCollection.fetch({
            data: { 'TODO': 'TODO' },
            success: function (collection, response, options) {
                self.collection.set(collection.sortBy('name'));
                self.render();
            },
            error: function (collection, response, options) {
                console.error(response);
                return null;
            }
        })
    }

    initAnnotateView(event: any): void {        
        if (this.currentAnnotateView) this.currentAnnotateView.$el.detach();

        let sourceId = $(event.currentTarget).data('source-id');
        let source = this.collection.get(sourceId);
        
        this.list.hide();
        this.currentAnnotateView = new AnnotateView(source);
        this.currentAnnotateView.render().$el.insertAfter(this.list);
        this.currentAnnotateView.initAnnotationViews();

        let self = this;
        this.currentAnnotateView.on('return', () => {
            self.currentAnnotateView.$el.detach();
            self.render();
        });
    }
}
extend(AnnoWelcomeView.prototype, {
    tagName: 'div',
    className: 'section',
    template: annoWelcomeTemplate,
    events: {
        'click .initAnnotations': 'initAnnotateView',
    }
});
