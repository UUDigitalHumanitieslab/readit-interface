import { extend } from 'lodash';

import { schema } from "../common-rdf/ns";
import FlatItem from "../common-adapters/flat-item-model";
import View from "../core/view";

import searchResultSourceTemplate from './search-result-source-template';

export default class SearchResultSourceView extends View<FlatItem> {
    title: string;
    author: string;
    datePublished: string;

    initialize() {
        const sourceItem = this.model.get('item');
        this.author = sourceItem.get(schema.author)[0];
        this.title = sourceItem.get(schema('name'))[0];
        const date = sourceItem.get(schema.datePublished)[0];
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
