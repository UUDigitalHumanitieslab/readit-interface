import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from './../../core/view';

import searchResultItemTemplate from './search-result-item-template';

import Node from '../../jsonld/node';

export interface ViewOptions extends BaseOpt<Node> {
    model: Node;
}

export default class SearchResultItemView extends View<Node> {

    constructor(options: ViewOptions) {
        super(options);
    }

    render(): this {
        this.$el.html(this.template(this));
        return this;
    }
}
extend(SearchResultItemView.prototype, {
    tagName: 'div',
    className: 'search-result-item',
    template: searchResultItemTemplate,
    events: {
    }
});
