import { extend } from 'lodash';
import * as _ from 'underscore';
import View from '../core/view';
import Collection from '../core/collection';

import DirectionRouter from '../global/ex_direction-router';
import searchboxView from '../global/searchbox';
import searchTemplate from './search-template';
import SnippetCollection from './../models/snippet-collection';
import Select2FilterView from '../filters/select/select2-filter-view';
import SelectFilterOption from '../filters/select/select-option';
import SearchResultsView from './searchresults-view';

export default class SearchView extends View {
    searchResultsView = undefined;
    initialSnippets = undefined;
    filterCollection: any;

    render(): View {
        this.$el.html(this.template({ results: this.collection.models }));

        this.$('#searchbox').append(searchboxView.render().$el);
        searchboxView.on("searchClicked", this.search, this)

        this.searchResultsView = new SearchResultsView();
        this.searchResultsView.collection = this.collection;
        this.$('#search-results-wrapper').append(this.searchResultsView.render().$el);

        this.setInitialSnippets();

        if (this.initialSnippets) {
            this.search(this.getQueryFromUrl());
        }

        return this;
    }

    initialize(): void {
        this.setInitialSnippets();
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

        this.collection.reset(_.filter(this.initialSnippets.models, function (model) {
            if (model.attributes.source.name.includes(query)) {
                return true;
            }
            // source author
            if (model.attributes.source.author.name.includes(query)) {
                return true;
            }
            // snippet text
            if (model.attributes.text.includes(query)) {
                return true;
            }
            // if (model.attributes.source.attributes.text.includes(query)) {
            //     return true;
            // }
            return false;
        }));

        this.initFilters();
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
        this.collection.reset(_.filter(this.initialSnippets.models, function (model) {
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

    setInitialSnippets(): void {
        var self = this;
        var snippetCollection = new SnippetCollection();

        snippetCollection.fetch({
            data: { 'TODO': 'TODO' },
            success: function (collection, response, options) {
                self.initialSnippets = new SnippetCollection(collection.models)
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


