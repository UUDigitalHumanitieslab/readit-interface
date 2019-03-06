import { extend } from 'lodash';
import * as _ from 'underscore';
import View from '../core/view';
import Collection from '../core/collection';

import directionRouter from '../global/ex_direction-router';
import searchboxView from './../global/searchbox';
import searchTemplate from './search-template';
import Select2FilterView from '../filters/select/select2-filter-view';
import SelectFilterOption from '../filters/select/select-option';
import SearchResultsView from './search-result/searchresults-view';
import SearchResultsCollection from './search-result/search-result-collection';
import SearchResult from './search-result/search-result';

export default class SearchView extends View {
    searchResultsView = undefined;
    initialSearchResults = undefined;
    filterCollection: any;

    render(): View {
        this.$el.html(this.template({ results: this.collection.models }));

        this.$('#searchbox').append(searchboxView.render().$el);
        searchboxView.on("searchClicked", this.onSearchClicked, this)

        this.searchResultsView = new SearchResultsView();
        this.searchResultsView.collection = this.collection;
        this.$('#search-results-wrapper').append(this.searchResultsView.render().$el);

        this.setInitialSources();
        this.collection.reset(this.getSearchResults());

        return this;
    }

    initialize(): void {
        this.setInitialSources();
        this.listenTo(this.collection, 'reset', this.updateResults)
    }

    onSearchClicked(query: string, queryfields: string = 'all') {
        var url = encodeURI(`search/?query=${query}&queryfields=${queryfields}`);
        directionRouter.navigate(url, { trigger: true });
        this.collection.reset(this.getSearchResults());
    }

    getSearchResults(): SearchResult[] {
        let query = directionRouter.queryParams['query']
        let queryfields = directionRouter.queryParams['queryfields']
        this.$('.searchbox input').val(query)
        return this.getQueriedSelection(query, queryfields)
    }

    getQueriedSelection(query: string, queryfields: any): SearchResult[] {
        return _.filter(this.initialSearchResults.models, function (result: SearchResult) {
            // 1. source title
            if ((queryfields === 'all' || queryfields === 'source_title') &&
                result.source.attributes.name.includes(query)) {
                return true;
            }
            // 2. source author
            if ((queryfields === 'all' || queryfields === 'source_author') &&
                result.source.attributes.author.name.includes(query)) {
                return true;
            }

            // 3. snippet text
            if (queryfields === 'all' || queryfields === 'snippet_text') {
                for (let snippet of result.fragment.snippets) {
                    if (snippet.text.includes(query)) {
                        return true;
                    }
                }
            }

            // 4. fragment text
            if ((queryfields === 'all' || queryfields === 'fragment_text') &&
                result.fragment.text.includes(query)) {
                return true;
            }

            return false;
        });
    }

    updateResults(): void {
        this.searchResultsView.render();
    }

    initFilters(): void {
        if (this.filterCollection) {
            for (let filter of this.filterCollection.models) {
                filter.attributes.remove()
            }
        }

        let filters = [];
        filters.push(this.initTypesFilter());
        filters.push(this.initSourcesFilter());

        for (let filter of filters) {
            this.$('.search-filters').append(filter.render().$el);
        }

        this.filterCollection = new Collection(filters);
    }

    initTypesFilter(): Select2FilterView {
        let types: SelectFilterOption[] = this.getTypeFilterOptions();
        let typesFilter = new Select2FilterView('Tagged with', types, 'Start typing to filter', true);
        typesFilter.on(typesFilter.ONSELECTIONCHANGED, this.onTypesSelectedChanged, this)
        return typesFilter;
    }



    onTypesSelectedChanged(selectedTypeIds: string[]): void {
        this.collection.reset(_.filter(this.getQueriedSelection(this.getQueryFromUrl()), function (searchResult) {
            if (selectedTypeIds.length == 0) {
                return true;
            }

            for (let tag of searchResult.tags) {
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
        for (let searchResult of this.collection.models) {
            for (let tag of searchResult.tags) {
                if (!allTypes.find(option => option.value === tag.id)) {
                    allTypes.push(new SelectFilterOption(tag.id, tag.attributes.name, `tag tag-${tag.attributes.className} is-medium`))
                }
            }
        }
        return allTypes;
    }

    initSourcesFilter(): Select2FilterView {
        let sources: SelectFilterOption[] = this.getSourceFilterOptions();
        let sourcesFilter = new Select2FilterView('Appearing in', sources, 'Start typing to filter', false);
        return sourcesFilter
    }

    getSourceFilterOptions(): SelectFilterOption[] {
        var allSources: SelectFilterOption[] = [];
        for (let searchResult of this.collection.models) {
            allSources.push(
                new SelectFilterOption(searchResult.source.attributes.id, searchResult.source.attributes.name))
        }
        return allSources;
    }

    setInitialSources(): void {
        var self = this;
        var snippetCollection = new SearchResultsCollection();

        snippetCollection.fetch({
            data: { 'TODO': 'TODO' },
            success: function (collection, response, options) {
                self.initialSearchResults = new SearchResultsCollection(collection.models)
                // self.search(self.getQueryFromUrl());
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


