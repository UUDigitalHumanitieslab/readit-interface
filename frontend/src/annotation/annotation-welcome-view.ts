import { extend, filter } from 'lodash';
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
    introtext: JQuery<Element>;

    collection: SourceCollection;

    render(): View {
        let json = this.collection.toJSON();
        let enSources = filter(json, s => s.language === "en");
        let frSources = filter(json, s => s.language === "fr");
        let deSources = filter(json, s => s.language === "de");
        this.$el.html(this.template({ enSources: enSources, frSources: frSources, deSources: deSources }));

        this.list = this.$("#list");
        this.introtext = this.$(".intro-text");

        return this;
    }

    initialize(): void {
        this.collection = new SourceCollection();
        this.listenTo(this.model, 'change', this.collectSources);
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
        this.introtext.hide();

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
