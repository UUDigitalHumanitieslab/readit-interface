import { extend } from 'lodash';

import View from '../core/view';
import searchTemplate from './search-template';
import SearchboxView from './searchbox-view';

export default class SearchView extends View { 
    searchboxView = undefined;
    
    render() {
        this.$el.html(this.template());
        this.searchboxView = new SearchboxView();
        this.$el.append(this.searchboxView.render().$el);        
        this.searchboxView.on("searchClicked", this.search)
        return this;
    }

    initialize() {
        
    }

    search(query) {
        console.log(query)
        
    }
}

extend(SearchView.prototype, {
    tagName: 'div',
    className: 'search',
    template: searchTemplate,
    events: {
    }
});


