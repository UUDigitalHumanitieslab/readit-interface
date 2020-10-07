
import { extend, filter, sampleSize } from 'lodash';

import { CompositeView } from './../core/view';
import Graph from '../jsonld/graph';
import explorerChannel from '../explorer/radio';
import ldChannel from '../jsonld/radio';
import { isRdfsClass } from '../utilities/utilities';
import { announceRoute } from '../explorer/utilities';

import suggestionsTemplate from './suggestions-template';
import SourceListView from '../panel-source-list/source-list-view';
import AnnotationListView from '../annotation/annotation-list-view';
import OntologyListView from '../ontology/ontology-list-view';
import LabelView from '../ontology/label-view';
import FlatAnnotationCollection from '../annotation/flat-annotation-collection';

const announce = announceRoute('explore');
const nSuggestions = 3;

export default class SuggestionsView extends CompositeView{
    sourceSuggestions: Graph;
    annotationGraph: Graph;
    annotationSuggestions: FlatAnnotationCollection;
    categorySuggestions: Graph;
    sourceList: SourceListView;
    annotationList: AnnotationListView;
    ontologyList: OntologyListView;


    initialize(){
        this.sourceSuggestions = new Graph();
        this.annotationGraph = new Graph();
        this.annotationSuggestions = new FlatAnnotationCollection(this.annotationGraph);
        this.categorySuggestions = new Graph();
        this.getSuggestions();
        this.sourceList = new SourceListView({collection: this.sourceSuggestions});
        this.listenTo(this.sourceList, 'source:clicked', this.openSource);
        this.annotationList = new AnnotationListView({collection: this.annotationSuggestions as FlatAnnotationCollection});
        this.listenTo(this.annotationList, 'annotation:clicked', this.openAnnotation);
        this.ontologyList = new OntologyListView({collection: this.categorySuggestions});
        this.listenTo(this.ontologyList, 'category:clicked', this.openRelevantAnnotations);
        this.on('announceRoute', announce);
        this.render();
    }

    async getSuggestions() {
        const param = $.param({ n_results: nSuggestions });
        this.sourceSuggestions.fetch({ url: '/source/suggestion', data: param });
        this.annotationGraph.fetch({ url: '/item/suggestion', data: param });
        const categories = await ldChannel.request('ontology:promise');
        const suggestions = sampleSize(filter(categories.models, isRdfsClass), nSuggestions);
        this.categorySuggestions.set(suggestions);
    }

    openSource(source: Node): void {
        explorerChannel.trigger('source-list:click', this, source);
    }

    openAnnotation(annotation: Node): void {
        this.$('.category-view.is-highlighted').removeClass('is-highlighted');
        explorerChannel.trigger('annotationList:showAnnotation', this, annotation);
    }

    openRelevantAnnotations(label: LabelView, category: Node): void {
        this.$('.is-highlighted').removeClass('is-highlighted');
        label.$el.addClass('is-highlighted');
        explorerChannel.trigger('category:showRelevantAnnotations', this, category);
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

}

extend(SuggestionsView.prototype, {
    template: suggestionsTemplate,
    className: 'suggestions explorer-panel',
    subviews: [
    { 
        view: 'sourceList',
        selector: '.selections' 
    },
    { 
        view: 'annotationList',
        selector: '.selections'
    },
    { 
        view: 'ontologyList',
        selector: '.selections'
    },
    ]
})