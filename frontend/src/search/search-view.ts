import { extend } from 'lodash';
import * as _ from 'underscore';
import View from '../core/view';
import Collection from '../core/collection';

import directionRouter from '../global/ex_direction-router';
import searchTemplate from './search-template';
import Select2FilterView from '../filters/select/select2-filter-view';
import { SelectFilterOption } from '../filters/select/select-option';
import SearchResultsView from './search-result/searchresults-view';
import SearchResultsCollection from './search-result/search-result-collection';
import SearchResult from './search-result/search-result';
import searchboxView from '../global/searchbox'

import { BaseFilterView } from '../filters/BaseFilterView';
import { MultiSelectFilter } from '../filters/select/multiSelectFilter';

export default class SearchView extends View {
    searchResultsView = undefined;

    /**
     * The initial collection of search results, for now loaded from json
     */
    initialSearchResults = undefined;

    /**
     * The current query
     */
    currentQuery: string = '';

    /**
     * The queried selection of search results, based on current query.
     */
    currentSearchResults: SearchResult[] = undefined;

    /**
     * Array of filter VIEWS
     */
    filterViewCollection: BaseFilterView[] = undefined;

    TYPEFILTERNAME = 'types';
    SOURCEFILTERNAME = 'sources';


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
        this.listenTo(this.collection, 'reset', this.updateResults)
    }

    onSearchClicked(query: string, queryfields: string = 'all') {
        var url = encodeURI(`search/?query=${query}&queryfields=${queryfields}`);
        directionRouter.navigate(url, { trigger: true });
        this.collection.reset(this.getSearchResults());
    }

    getSearchResults(): SearchResult[] {
        this.currentQuery = directionRouter.queryParams['query']
        let queryfields = directionRouter.queryParams['queryfields']
        this.$('.searchbox input').val(this.currentQuery)
        this.currentSearchResults = this.getQueriedSelection(this.currentQuery, queryfields)
        this.updateFilters();
        return this.currentSearchResults;
        // this.applyFilters()
    }

    getQueriedSelection(query: string, queryfields: any): SearchResult[] {
        return _.filter(this.initialSearchResults.models, function (result: SearchResult) {
            // 1. source title
            if ((queryfields === 'all' || queryfields === 'source_title') &&
                result.source.attributes.name.toLowerCase().includes(query.toLowerCase())) {
                return true;
            }
            // 2. source author
            if ((queryfields === 'all' || queryfields === 'source_author') &&
                result.source.attributes.author.name.toLowerCase().includes(query.toLowerCase())) {
                return true;
            }

            // 3. snippet text
            if (queryfields === 'all' || queryfields === 'snippet_text') {
                for (let snippet of result.fragment.snippets) {
                    if (snippet.text.toLowerCase().includes(query.toLowerCase())) {
                        return true;
                    }
                }
            }

            // 4. fragment text
            if ((queryfields === 'all' || queryfields === 'fragment_text') &&
                result.fragment.text.toLowerCase().includes(query.toLowerCase())) {
                return true;
            }

            return false;
        });
    }

    updateResults(): void {
        this.searchResultsView.render();
    }

    updateFilters(): void {
        if (!this.filterViewCollection) {
            this.initFilters();
        }

        // for (let filterView of this.filterViewCollection) {
        //     // filterView.attributes.remove()
        //     console.log(filterView)
        // }

        // let filters = [];
        // filters.push(this.setTypesFilter(queryResults));
        // // filters.push(this.initSourcesFilter());



        for (let filterView of this.filterViewCollection) {
            this.$('.search-filters').append(filterView.render().$el);
        }

        // this.filterViewCollection = new Collection(filters);
    }

    initFilters() {
        this.filterViewCollection = [];
        this.filterViewCollection.push(this.setTypesFilter());
        this.filterViewCollection.push(this.setSourcesFilter());

        for (let filterView of this.filterViewCollection) {
            filterView.on('changed', this.applyFilters, this)
        }
    }

    setTypesFilter(): Select2FilterView {
        let types: SelectFilterOption[] = this.getTypeFilterOptions(this.currentSearchResults);
        let typesFilter = new MultiSelectFilter(this.TYPEFILTERNAME, types, 'Annotated as', 'Start typing to filter');
        let typesFilterView = new Select2FilterView(typesFilter, true);
        return typesFilterView;
    }

    setSourcesFilter(): Select2FilterView {
        let sources: SelectFilterOption[] = this.getSourceFilterOptions(this.currentSearchResults);
        let sourceFilter: MultiSelectFilter = new MultiSelectFilter(this.SOURCEFILTERNAME, sources, 'Appearing in', 'Start typing to filter');
        let sourcesFilterView = new Select2FilterView(sourceFilter, false);
        return sourcesFilterView
    }

    applyFilters() {
        let selectedTypeIds, selectedSourceIds;

        for (let filterView of this.filterViewCollection) {
            if (filterView.filter.name === this.TYPEFILTERNAME) {
                selectedTypeIds = filterView.filter.value;
            }

            if (filterView.filter.name === this.SOURCEFILTERNAME) {
                selectedSourceIds = filterView.filter.value
            }
        }

        this.collection.reset(_.filter(this.currentSearchResults, function (searchResult) {
            if ((selectedTypeIds && selectedTypeIds.length == 0) &&
                (selectedSourceIds && selectedSourceIds.length == 0)) {
                return true;
            }

            if (selectedTypeIds) {
                for (let tag of searchResult.tags) {
                    for (let id of selectedTypeIds) {
                        if (+id === tag.id) {
                            return true
                        }
                    }
                }
            }

            if (selectedSourceIds) {
                for (let id of selectedSourceIds) {
                    if (searchResult.source.id == id) {
                        return true;
                    }
                }
            }
            return false;
        }));
    }

    getTypeFilterOptions(queryResults: SearchResult[]): SelectFilterOption[] {
        var allTypes: SelectFilterOption[] = [];

        console.log(queryResults)

        for (let searchResult of queryResults) {
            for (let tag of searchResult.tags) {
                if (!allTypes.find(option => +option.value === tag.id)) {
                    allTypes.push(new SelectFilterOption(tag.id.toString(), tag.attributes.name, `tag ${tag.attributes.className} is-medium`))
                }
            }
        }
        return allTypes;
    }

    getSourceFilterOptions(queryResults: SearchResult[]): SelectFilterOption[] {
        var allSources: SelectFilterOption[] = [];
        for (let searchResult of queryResults) {
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


