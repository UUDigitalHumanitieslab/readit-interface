import { extend } from 'lodash';
import View from '../../core/view';

import searchboxTemplate from './searchbox-template';
import QueryField from './query-field'

export default class SearchboxView extends View {
    placeholder: string;
    queryFields: QueryField[] = undefined;
    /**
     * Ctor for SearchboxView
     * @param queryFields Set of fields to include in the query
     * @param placeholder Defaults to 'in fields..'
     */
    constructor(
        queryFields: QueryField[],
        placeholder: string = "in fields..") {
        super()
        this.queryFields = queryFields;
        this.placeholder = placeholder;
    }

    render() {
        this.$el.html(this.template(this));
        return this;
    }

    onKeyUp(e) {
        if (e.keyCode == 13) {
            this.search(e);
        }
    }

    initialize() {

    }

    search(event: any) {
        event.preventDefault();
        var query = this.$('.input').val();
        this.trigger("searchClicked", query)
    }
}

extend(SearchboxView.prototype, {
    tagName: 'div',
    className: 'searchbox',
    template: searchboxTemplate,
    events: {
        "click .button": "search",
        "keyup input": "onKeyUp",
    }
});