import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from '../../core/view';

import searchResultSourceTemplate from './search-result-source-template';

import Node from '../../jsonld/node';

export interface ViewOptions extends BaseOpt<Node> {
    model: Node;
}

export default class SearchResultSourceView extends View<Node> {

    constructor(options: ViewOptions) {
        super(options);
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
    events: {
    }
});
