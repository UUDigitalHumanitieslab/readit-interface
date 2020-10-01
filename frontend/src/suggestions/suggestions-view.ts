
import { extend, sampleSize } from 'lodash';

import { CompositeView } from './../core/view';
import Graph from '../jsonld/graph';
import ldChannel from '../jsonld/radio';
import explorerChannel from '../explorer/radio';

import suggestionsTemplate from './suggestions-template';
import SourceListView from '../panel-source-list/source-list-view';
import AnnotationListView from '../annotation/annotation-list-view';
import OntologyListView from '../ontology/ontology-list-view';

const nSuggestions = 3;

export default class SuggestionsView extends CompositeView{
    sourceSuggestions: Graph;
    annotationSuggestions: Graph;
    categorySuggestions: Graph;
    sourceList: SourceListView;
    annotationList: AnnotationListView;
    ontologyList: OntologyListView;


    initialize(){
        this.sourceSuggestions = new Graph();
        this.annotationSuggestions = new Graph();
        this.categorySuggestions = new Graph();
        this.getSuggestions();
        this.sourceList = new SourceListView({collection: this.sourceSuggestions});
        this.listenTo(this.sourceList, 'source-list:click', this.openSource);
        this.annotationList = new AnnotationListView({collection: this.annotationSuggestions});
        this.ontologyList = new OntologyListView({collection: this.categorySuggestions});
        this.render();
    }

    async getSuggestions() {
        const param = $.param({ n_results: nSuggestions });
        this.sourceSuggestions.fetch({ url: '/source/suggestion', data: param });
        this.annotationSuggestions.fetch({ url: '/item/suggestion', data: param });
        const categories = new Graph();
        categories.fetch({ url: '/ontology' });
        this.categorySuggestions.reset(sampleSize(categories.models, nSuggestions));
    }

    openSource(source: Node) {
        explorerChannel.trigger('source-list:click', this, source);
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

}

extend(SuggestionsView.prototype, {
    template: suggestionsTemplate,
    className: 'suggestions explorer-panel',
    tagName: 'div',
    subviews: [
    { view: 'sourceList', selector: 'source-suggestions' },
    { view: 'anntoationList', selector: 'annotation-suggestions' },
    { view: 'categoryList', selector: 'category-suggestions' },
    ],
    container: '.selections'
})
