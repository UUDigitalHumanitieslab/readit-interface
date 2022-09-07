import { extend } from 'lodash';

import { sourceOntology } from "../common-rdf/ns";
import FlatItem from "../common-adapters/flat-item-model";
import View from "../core/view";

import searchResultSourceTemplate from './search-result-source-template';

export default class SearchResultSourceView extends View<FlatItem> {
    title: string;
    author: string;
    datePublished: string;

    initialize() {
        const sourceItem = this.model.get('item');
        this.author = sourceItem.get(sourceOntology.author)[0];
        this.title = sourceItem.get(sourceOntology.title)[0];
        const date = sourceItem.get(sourceOntology.datePublished)[0];
        this.datePublished = date.toISOString().split("T")[0];
    }

    render(): this {
        this.$el.html(this.template(this));
        return this;
    }
}

extend(SearchResultSourceView.prototype, {
    tagName: 'div',
    className: 'search-result-source',
    template: searchResultSourceTemplate,
});
