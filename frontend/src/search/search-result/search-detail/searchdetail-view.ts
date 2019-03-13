import { extend } from 'lodash';
import View from '../../../core/view';
import SearchResult from '../search-result';
import searchDetailTemplate from './searchdetail-template';
import Model from '../../../core/model';
import * as _ from 'underscore';
import * as bulmaAccordion from 'bulma-accordion';
import ItemLink from '../../../models/itemLink';

export default class SearchDetailView extends View {
    searchResult: Model;

    categoryTabs: {
        id: number;
        name: string;
        class: string;
        instances: any[][]
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

    prepareAccordions() {
        var accordions = [];
        this.$('.accordions').each(function (i, element) {
            $(element).children('.accordion').first().addClass("is-active");
            accordions.push(new bulmaAccordion(element));
        });
        return accordions
    }

    buildCategoryTabs(searchResult: SearchResult) {
        searchResult.fragment.snippets.forEach(snippet => {
            snippet.items.forEach(item => {
                if (_.has(item.category, 'attributes')) {
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
                    if (_.some(this.otherCategories, function (x) {
                        return x.category.name === item.category.name;
                    })) {
                        var index = _.findIndex(this.otherCategories, function (x) { return x.category.name === item.category.name; })
                        this.otherCategories[index].values.push(snippet.text)
                    } else {
                        var c = item.category;
                        this.otherCategories.push({
                            category: c,
                            values: [snippet.text]
                        })
                    }

                }
            })
        })
    }

}

extend(SearchDetailView.prototype, {
    tagName: 'div',
    className: 'searchdetail',
    template: searchDetailTemplate,
    events: {
        'click .delete': 'closeModal',
        'click .tab': 'tabClickHandler',
        'keydown': 'keydownHandler'
    }
});
