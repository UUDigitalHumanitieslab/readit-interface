import { extend } from 'lodash';
import View from '../../../core/view';
import SearchResult from '../search-result';
import searchDetailTemplate from './searchdetail-template';
import Model from '../../../core/model';
import * as _ from 'underscore';
import * as bulmaAccordion from 'bulma-accordion';
import ItemLink from '../../../models/itemLink';
import mockAnnotationCategories from '../../../models/mock-annotation-categories';
import Item from '../../../models/item';

export default class SearchDetailView extends View {
    searchResult: Model;

    categoryTabs: {
        id: number;
        name: string;
        class: string;
        instances: {
            attributes: {
                id: number;
                name: string;
                value: string;
            }[]
        }[]
    }[] = [];
    otherCategories: {
        category: {
            id: number;
            name: string;
            class: string;
        },
        values: string[];
    }[] = [];

    /**
     * Ctor for SearchDetailView
     * @param searchResult current search result
     */
    constructor(searchResult: Model) {
        super()
        this.searchResult = searchResult;
    }

    render() {
        this.buildCategoryTabs(this.searchResult);
        this.sortCategoryTabs();
        this.sortSnippets();
        this.$el.html(this.template({
            source: this.searchResult.source,
            fragment: this.searchResult.fragment,
            tags: this.searchResult.tags,
            categoryTabs: this.categoryTabs,
            otherCategories: this.otherCategories
        }));
        var accordions = this.prepareAccordions();
        return this;
    }

    initialize() {
        $(window).one('keydown', event => this.keydownHandler(event))
    }

    closeModal() {
        this.trigger('closeDetail');
    }

    tabClickHandler(event: any) {
        var clickedTab = $(event.currentTarget);
        var tabID = clickedTab.attr('value');

        $('.tab').removeClass('is-active');
        clickedTab.addClass('is-active');

        $('.tab-content').not(`#${tabID}`).hide();
        $(`#${tabID}`).show();
    }

    keydownHandler(event: any) {
        event.preventDefault();
        if (event.keyCode === 27) {
            this.closeModal()
        }
    }

    /**
     * Activate javascript for accordion control, and set first entry active for each one.
     * Part of bulma-accordion package. 
     * @return {bulmaAccordion[]} Array of accordions. 
    */
    prepareAccordions() {

        var accordions = [];
        this.$('.accordions').each(function (i, element) {
            $(element).children('.accordion').first().addClass("is-active");
            accordions.push(new bulmaAccordion(element));
        });
        return accordions;
    }

    sortSnippets() {
        // console.log(mockAnnotationCategories)
        _.each(this.searchResult.fragment.snippets, snippet => {
            snippet.items = _.sortBy(snippet.items, item => {
                return _.findIndex(mockAnnotationCategories, annotationCat => {
                    return annotationCat.name == item.category.name;
                });
            });
        });

        this.searchResult.fragment.snippets = _.sortBy(this.searchResult.fragment.snippets, snippet => {
            return _.findIndex(mockAnnotationCategories, annotationCat => {
                return annotationCat.name == snippet.items[0].category.name;
            });
        });
    }

    /**
     * Gathers categories into tabs. 
     * Categories with attributes get a tab each, with an entry for each snippet containing it.
     * Categories without attributes are summed in the 'other' tab.
     * @param {SearchResult} searchResult The current search result. 
    */
    buildCategoryTabs(searchResult: SearchResult) {
        searchResult.fragment.snippets.forEach(snippet => {
            snippet.items.forEach(item => {
                if (_.has(item.category, 'attributes')) {
                    // Categories with attributes.
                    // Checks if the category already has a tab, and add or create to/of tab depending on the outcome.
                    // @reviewers, there is probably a simpler way to do this. 
                    if (_.some(this.categoryTabs, function (x) {
                        return x.name === item.category.name;
                    })) {
                        var index = _.findIndex(this.categoryTabs, function (x) { return x.name === item.category.name; })
                        this.categoryTabs[index].instances.push({ attributes: item.category.attributes })
                    } else {
                        var c = item.category;
                        var new_cat = {
                            id: c.id,
                            name: c.name,
                            class: c.class,
                            instances: [{ attributes: c.attributes }]
                        }
                        this.categoryTabs.push(new_cat)
                    }
                } else {
                    // Categories without attributes
                    if (_.some(this.otherCategories, function (x) {
                        return x.category.name === item.category.name;
                    })) {
                        var index = _.findIndex(this.otherCategories, function (x) { return x.category.name === item.category.name; })
                        this.otherCategories[index].values.push(snippet.text)
                    } else {
                        this.otherCategories.push({
                            category: item.category,
                            values: [snippet.text]
                        })
                    }
                }
            })
        })
    }

    sortCategoryTabs() {
        this.otherCategories = _.sortBy(this.otherCategories, category => {
            return _.findIndex(mockAnnotationCategories, annotationCat => {
                return annotationCat.name == category.category.name;
            });
        });
        this.categoryTabs = _.sortBy(this.categoryTabs, category => {
            return _.findIndex(mockAnnotationCategories, annotationCat => {
                return annotationCat.name == category.name;
            });
        });
    }

}

extend(SearchDetailView.prototype, {
    tagName: 'div',
    className: 'searchdetail',
    template: searchDetailTemplate,
    events: {
        'click .delete': 'closeModal',
        'click .tab': 'tabClickHandler'
    }
});
