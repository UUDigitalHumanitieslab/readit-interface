import { extend } from 'lodash';
import View from '../../core/view';

import searchboxTemplate from './searchbox-template';
import QueryField from './query-field'

export default class SearchboxView extends View {
    defaultOption: QueryField;
    queryFields: QueryField[] = undefined;
    /**
     * Ctor for SearchboxView
     * @param queryFields Set of fields to include in the query
     * @param initial Option that is initially selected. Defaults to first option.
     */
    constructor(
        queryFields: QueryField[],
        defaultOption: QueryField = queryFields[0]) {
        super()
        this.queryFields = queryFields;
        this.defaultOption = defaultOption;
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
        var query = this.$(".input").val();
        var queryfields = this.$(".dropdown-item.is-active").attr("value")
        this.trigger("searchClicked", query, queryfields)
    }

    selectField(event: any) {
        var target = $(event.target);
        $("#selected-option").html(target.html());
        $(".dropdown-item").removeClass("is-active");
        target.addClass("is-active");
    }
}

extend(SearchboxView.prototype, {
    tagName: 'div',
    className: 'searchbox',
    template: searchboxTemplate,
    events: {
        "click .button": "search",
        "click .dropdown-item": "selectField",
        "keyup input": "onKeyUp",
    }
});