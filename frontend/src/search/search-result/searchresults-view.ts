import { extend } from 'lodash';

import View from '../../core/view';
import searchResultsTemplate from './searchresults-template';
import SearchDetailView from './search-detail/searchdetail-view';

export default class SearchResultsView extends View {

    render() {
        this.$el.html(this.template({ results: this.collection.models }));
        return this;
    }

    initialize() {
    }

    showDetails(event: any) {
        var searchDetailModal = new SearchDetailView()
        searchDetailModal.render().$el.appendTo($("#result-detail-container"))
    }

}

extend(SearchResultsView.prototype, {
    tagName: 'div',
    className: 'searchresults',
    template: searchResultsTemplate,
    events: {
        "click .searchresult-resultbox": "showDetails"
    }
});
