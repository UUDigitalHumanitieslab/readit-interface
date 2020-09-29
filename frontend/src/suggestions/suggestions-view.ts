
import { extend, sampleSize } from 'lodash';

import { CompositeView } from './../core/view';
import Graph from '../jsonld/graph';

import suggestionsTemplate from './suggestions-template';
import SourceListView from '../panel-source-list/source-list-view';
import AnnotationListView from '../annotation/panel-annotation-list-view';

export default class SuggestionsView extends CompositeView{
    sourceSuggestions: Graph;
    annotationSuggestions: Graph;
    categorySuggestions: Graph;
    nSuggestions: number;
    sourceList: SourceListView;
    annotationList: AnnotationListView;


    initialize(){
        this.nSuggestions = 3;
        this.getSuggestions();
        this.sourceList = new SourceListView({collection: this.sourceSuggestions});
        this.annotationList = new AnnotationListView({collection: this.annotationSuggestions});
        this.render();
    }

    async getSuggestions() {
        this.sourceSuggestions = new Graph();
        this.annotationSuggestions = new Graph();
        const categories = new Graph();
        const param = $.param({ n_results: this.nSuggestions });
        await this.sourceSuggestions.fetch({ url: '/source/suggestion', data: param });
        await this.annotationSuggestions.fetch({ url: '/item/suggestion', data: param });
        await categories.fetch({ url: '/ontology' });
        this.categorySuggestions = new Graph({ models: sampleSize(categories.models, this.nSuggestions) });
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
    subviews: [{ view: 'sourceList', selector: 'source-suggestions' },
    { view: 'anntoationList', selector: 'annotation-suggestions' },
    // { view: 'categoryList', selector: 'category-suggestions' },
    ],
    container: '.suggestions'
})