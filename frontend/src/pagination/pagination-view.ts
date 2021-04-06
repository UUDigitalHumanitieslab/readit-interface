import { extend } from 'lodash';

import View, {ViewOptions as BaseOpt} from '../core/view';

import PaginationTemplate from './pagination-template';

export interface ViewOptions extends BaseOpt {
    totalPages: number;
    initialPage?: number;
}

export default class PaginationView extends View {
    totalPages: number;
    showPaginationLinks: PaginationLinks;
    currentPage: number;
    pageCenter: number;
    pagePlus: number;
    pageMinus: number;
    numberPaginationLinks: number;

    initialize(options: ViewOptions) {
        this.totalPages = options.totalPages;
        // there are three pagination links around the current page
        this.numberPaginationLinks = 3;
        this.determineCurrentPages(options.initialPage || 1);
    }

    render(): this {
        if (this.totalPages < 2) return this;
        this.$el.html(this.template(this));
        // add is-current class to left, center or right pagination link
        if (this.currentPage === this.pagePlus) {
            this.$('#page-plus').addClass('is-current');
        } else if (this.currentPage === this.pageCenter) {
            this.$('#page-center').addClass('is-current');
        } else if (this.currentPage === this.pageMinus) {
            this.$('#page-minus').addClass('is-current');
        }
        //disable previous and next buttons if we are on first or last page
        if (this.currentPage === 1) {
            this.$('.pagination-previous').attr('disabled', 'true');
        } else if (this.currentPage === this.totalPages) {
            this.$('.pagination-next').attr('disabled', 'true');
        }
        return this;
    }

    initializePaginationLinks() {
        return {
            start: false,
            ellipsisStart: false,
            pagePlus: true,
            ellipsisEnd: false,
            end: false
        }
    }

    determineCurrentPages(page: number) {
        this.currentPage = page;
        this.showPaginationLinks = this.initializePaginationLinks();
        this.adjustPaginationLinks(page);
        if (page === 1) {
            this.pageMinus = page;
            this.pageCenter = page + 1;
            this.pagePlus = page + 2;
        } else if (this.totalPages >= this.numberPaginationLinks && page === this.totalPages) {
            // apply this rule if we are at the final page
            // exception: if we only have two pages, apply else condition instead
            this.pageMinus = page - 2;
            this.pageCenter = page - 1;
            this.pagePlus = page;
        } else {
            this.pageMinus = page - 1;
            this.pageCenter = page;
            this.pagePlus = page + 1;
        }
        this.render();
    }

    adjustPaginationLinks(page: number) {
        // only show right pagination link (page-plus) if we have more than two pages
        if (this.totalPages < this.numberPaginationLinks) this.showPaginationLinks['pagePlus'] = false;
        // control visiblity of first / last page link
        // never show them if our total pages don't exceed the number of pagination links (3)
        if (this.totalPages > this.numberPaginationLinks && page > 2) this.showPaginationLinks['start'] = true;
        if (this.totalPages > this.numberPaginationLinks && page < this.totalPages-1) this.showPaginationLinks['end'] = true;
        // control visiblity of ellipses at start and end
        if (page > 3) this.showPaginationLinks['ellipsisStart'] = true;
        if (page < this.totalPages-2) this.showPaginationLinks['ellipsisEnd'] = true;
    }

    clickPrevious() {
        this.triggerSearch(this.currentPage-1);
    }

    clickNext() {
        this.triggerSearch(this.currentPage+1);
    }

    clickPageLink(event) {
        const page = parseInt(event.currentTarget.text);
        if (page == this.currentPage) return;
        this.triggerSearch(page);
    }

    triggerSearch(page: number) {
        this.trigger("pagination:set", page);
        this.determineCurrentPages(page);
    }


}

extend(PaginationView.prototype, {
    className: 'pagination',
    template: PaginationTemplate,
    events: {
        'click .pagination-previous:not([disabled])': 'clickPrevious',
        'click .pagination-next:not([disabled])': 'clickNext',
        'click .pagination-link': 'clickPageLink'
    }
});

interface PaginationLinks {
    start: boolean;
    ellipsisStart: boolean
    pagePlus: boolean
    ellipsisEnd: boolean
    end: boolean
}