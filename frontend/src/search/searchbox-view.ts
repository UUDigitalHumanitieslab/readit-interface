import { extend } from 'lodash';
import View from '../core/view';
import searchboxTemplate from './searchbox-template';

export default class SearchboxView extends View {     
    render() {
        this.$el.html(this.template());
        return this;
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
        "submit #search-form": "search",
    }
});