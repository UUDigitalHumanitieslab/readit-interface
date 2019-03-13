import { extend } from 'lodash';
import View from '../../../core/view';
import SearchResult from '../search-result';
import searchDetailTemplate from './searchdetail-template';
import Model from '../../../core/model';
import * as _ from 'underscore';

export default class SearchDetailView extends View {
    searchResult: Model;

    categoryTabs: {
        id: number;
        name: string;
        class: string;
        attributes: {
            id: number,
            name: string;
            value: string;
        }[]
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
        this.$el.html(this.template({
            source: this.searchResult.source,
            fragment: this.searchResult.fragment,
            tags: this.searchResult.tags,
            categoryTabs: this.categoryTabs,
        }));
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

    buildCategoryTabs(searchResult: SearchResult) {
        searchResult.fragment.snippets.forEach(snippet => {
            snippet.items.forEach(item => {
                if (_.has(item.category, 'attributes')) {
                    // console.log('with attributes', item.category);
                    this.categoryTabs.push(item.category)
                } else {
                    // console.log('without attributes', item.category);
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
