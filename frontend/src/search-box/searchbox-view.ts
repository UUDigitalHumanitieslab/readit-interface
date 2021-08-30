import { extend } from 'lodash';
import View from '../core/view';

import searchboxTemplate from './searchbox-template';
import QueryField from './query-field'

export default class SearchboxView extends View {
    defaultOption: QueryField;
    fields: QueryField[] = undefined;

    /**
     * Ctor for SearchboxView
     * @param queryFields Set of fields to include in the query
     * @param initial Option that is initially selected. Defaults to first option.
     */
    constructor(
        queryFields: QueryField[],
        defaultOption: QueryField = queryFields[0]) {
        super()
        this.fields = queryFields;
        this.defaultOption = defaultOption;
        this.render();
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

    search(event: any) {
        event.preventDefault();
        const query = this.$('.input').val();
        const fields = this.$(".dropdown-item.is-active").attr("value") || 'all';
        this.trigger("search:textual", { query, fields });
    }

    selectField(event: any) {
        event.preventDefault();
        event.stopPropagation();
        var target = $(event.target);
        $("#selected-option").html(target.html());
        $(".dropdown-item").removeClass("is-active");
        target.addClass("is-active");
    }
}

extend(SearchboxView.prototype, {
    className: 'searchbox',
    template: searchboxTemplate,
    events: {
        "click #searchbox-button": "search",
        "click .dropdown-item": "selectField",
        "keyup input": "onKeyUp",
    },
});
