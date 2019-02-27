import { extend } from 'lodash';
import * as _ from 'underscore';
import View from '../core/view';
import Collection from '../core/collection';

import DirectionRouter from '../global/ex_direction-router';
import searchboxView from '../global/searchbox';
import searchTemplate from './search-template';
import Select2FilterView from '../filters/select/select2-filter-view';
import SelectFilterOption from '../filters/select/select-option';
import SearchResultsView from './search-result/searchresults-view';
import SearchResultsCollection from './search-result/search-result-collection';

export default class SearchView extends View {
    searchResultsView = undefined;
    initialSearchResults = undefined;
    filterCollection: any;

    render(): View {
        this.$el.html(this.template({ results: this.collection.models }));

        this.$('#searchbox').append(searchboxView.render().$el);        

        this.searchResultsView = new SearchResultsView();        
        this.searchResultsView.collection = this.collection;
        this.$('#search-results-wrapper').append(this.searchResultsView.render().$el);

        this.setInitialSources();

        if (this.initialSearchResults) {
            this.search(this.getQueryFromUrl());
        }

        return this;
    }

    initialize(): void {
        this.setInitialSources();
        this.listenTo(this.collection, 'reset', this.updateResults)
    }

    getQueryFromUrl(): string {
        let index = window.location.href.lastIndexOf('/');
        let query = decodeURI(window.location.href.substring(index + 1));
        this.$('input').val(query)
        return query;
    }

    search(query: string) {
        var url = encodeURI(`search/${query}`);
        DirectionRouter.navigate(url, { trigger: true });

        console.log(this.initialSearchResults)
        
        this.collection.reset(_.filter(this.initialSearchResults.models, function (result) {
            console.log(result)
            
            // 1. source title
            // if (result.attributes.name.includes(query)) {
            //     return true;
            // }
            // 2. source author
            // if (result.attributes.author.name.includes(query)) {
            //     return true;
            // }
            
            // for (let fragment of result.attributes.fragments) {
            //     // 3. snippet text

            //     // 4. fragment text
            // }

            return true;
        }));

        this.initFilters();
    }

    updateResults(): void {
        this.searchResultsView.render();
    }

    initFilters(): void {
        // if (this.filterCollection) {
        //     for (let filter of this.filterCollection.models) {
        //         filter.attributes.remove()
        //     }
        // }

        // let filters = [];
        // filters.push(this.initTypesFilter());

        // for (let filter of filters) {
        //     this.$('.search-filters').append(filter.render().$el);
        // }

        // this.filterCollection = new Collection(filters);
    }

    initTypesFilter(): Select2FilterView {
        let types: SelectFilterOption[] = this.getTypeFilterOptions();
        let typesFilter = new Select2FilterView('Tagged with', types, 'Start typing to filter', true);
        typesFilter.on(typesFilter.ONSELECTIONCHANGED, this.onTypesSelectedChanged, this)
        return typesFilter;
    }

    onTypesSelectedChanged(selectedTypeIds: string[]): void {
        this.collection.reset(_.filter(this.initialSearchResults.models, function (model) {
            if (selectedTypeIds.length == 0) {
                return true;
            }

            let tags = model.get('tags')

            for (let tag of tags) {
                for (let id of selectedTypeIds) {
                    if (+id === tag.id) {
                        return true
                    }
                }
            }

            return false;
        }));
    }

    getTypeFilterOptions(): SelectFilterOption[] {
        var allTypes: SelectFilterOption[] = [];
        for (let snippet of this.collection.models) {
            for (let tag of snippet.attributes.tags) {
                if (!allTypes.find(option => option.value === tag.id)) {
                    allTypes.push(new SelectFilterOption(tag.id, tag.name, `tag tag-${tag.className} is-medium`))
                }
            }
        }
        return allTypes;
    }

    setInitialSources(): void {
        var self = this;
        var snippetCollection = new SearchResultsCollection();

        snippetCollection.fetch({
            data: { 'TODO': 'TODO' },
            success: function (collection, response, options) {
                self.initialSearchResults = new SearchResultsCollection(collection.models)                
                self.search(self.getQueryFromUrl());
                self.initFilters();
            },
            error: function (collection, response, options) {
                console.error(response)
                return null;
            }
        })
    }
}
extend(SearchView.prototype, {
    tagName: 'div',
    className: 'search',
    template: searchTemplate,
    events: {
    }
});


