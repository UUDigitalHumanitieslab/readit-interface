import { extend, filter, sampleSize } from 'lodash';

import { baseUrl } from 'config.json';
import { CompositeView } from './../core/view';
import Graph from '../common-rdf/graph';
import ItemGraph from '../common-adapters/item-graph';
import explorerChannel from '../explorer/explorer-radio';
import ldChannel from '../common-rdf/radio';
import { isRdfsClass } from '../utilities/linked-data-utilities';
import { announceRoute } from '../explorer/utilities';

import suggestionsTemplate from './suggestions-template';
import SourceListView from '../panel-source-list/source-list-view';
import AnnotationListView from '../panel-annotation-list/annotation-list-view';
import OntologyListView from '../ontology/ontology-list-view';
import FlatAnnotationCollection from '../common-adapters/flat-annotation-collection';
import FlatItemCollection from '../common-adapters/flat-item-collection';
import FlatItem from '../common-adapters/flat-item-model';

const announce = announceRoute('explore');
const nSuggestions = 3;
const sourceSuggestionsURL = baseUrl + 'source/suggestion';
const itemSuggestionsUrl = baseUrl + 'item/suggestion';

export default class SuggestionsView extends CompositeView{
    sourceSuggestions: Graph;
    annotationGraph: ItemGraph;
    annotationSuggestions: FlatAnnotationCollection;
    categoryGraph: Graph;
    categorySuggestions: FlatItemCollection;
    sourceList: SourceListView;
    annotationList: AnnotationListView;
    ontologyList: OntologyListView;

    initialize(){
        this.sourceSuggestions = new Graph();
        this.annotationGraph = new ItemGraph();
        this.annotationSuggestions = new FlatAnnotationCollection(this.annotationGraph);
        this.listenTo(this.annotationSuggestions, 'focus', this.openAnnotation);
        this.categoryGraph = new Graph();
        this.categorySuggestions = new FlatItemCollection(this.categoryGraph);
        this.listenTo(this.categorySuggestions, 'focus', this.openRelevantAnnotations);
        this.getSuggestions();
        this.sourceList = new SourceListView({collection: this.sourceSuggestions});
        this.listenTo(this.sourceList, 'source:clicked', this.openSource);
        this.annotationList = new AnnotationListView({collection: this.annotationSuggestions as FlatAnnotationCollection});
        this.ontologyList = new OntologyListView({collection: this.categorySuggestions});
        this.on('announceRoute', announce);
        this.render();
    }

    async getSuggestions() {
        const param = $.param({ n_results: nSuggestions });
        this.sourceSuggestions.fetch({ url: sourceSuggestionsURL, data: param });
        this.annotationGraph.fetch({ url: itemSuggestionsUrl, data: param });
        const categories = await ldChannel.request('ontology:promise');
        const suggestions = sampleSize(filter(categories.models, isRdfsClass), nSuggestions);
        this.categoryGraph.set(suggestions);
    }

    openSource(source: Node): void {
        this.$('.is-highlighted').removeClass('is-highlighted');
        explorerChannel.trigger('source-list:click', this, source);
    }

    openAnnotation(annotation: Node): void {
        this.$('.category-view.is-highlighted').removeClass('is-highlighted');
        explorerChannel.trigger('annotationList:showAnnotation', this, annotation, this.annotationList.collection);
    }

    openRelevantAnnotations(category: FlatItem): void {
        this.$('.item-sum-block.is-highlighted').removeClass('is-highlighted');
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
        selector: '.source-suggestions'
    },
    {
        view: 'annotationList',
        selector: '.annotation-suggestions'
    },
    {
        view: 'ontologyList',
        selector: '.category-suggestions'
    },
    ]
})
