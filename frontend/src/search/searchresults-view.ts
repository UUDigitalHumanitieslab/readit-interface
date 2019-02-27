import { extend } from 'lodash';

import View from '../core/view';
import searchResultsTemplate from './searchresults-template';

export default class SearchResultsView extends View {    
    
    render() {        
        this.$el.html(this.template({results: this.collection.models}));
        return this;
    }

    initialize() {
    }
}

extend(SearchResultsView.prototype, {
    tagName: 'div',
    className: 'searchresults',
    template: searchResultsTemplate,
    events: {
    }
});
