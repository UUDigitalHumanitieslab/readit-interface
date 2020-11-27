import { extend } from 'lodash';

import View, {ViewOptions as BaseOpt} from '../core/view';

import PaginationTemplate from './pagination-template';

export interface ViewOptions extends BaseOpt {
    totalPages: number;
}

export default class PaginationView extends View {
    totalPages: number;
    showPaginationLinks: PaginationLinks;
    currentPage: number;
    pageCenter: number;
    pagePlus: number;
    pageMinus: number;
    showFirstLastPageLink: boolean;

    initialize(options: ViewOptions) {
        this.totalPages = options.totalPages;
        // show the first and last page link only if we have more than three pages
        this.showFirstLastPageLink = this.totalPages > 3 ? true : false;
        this.determineCurrentPages(1);
    }

    render(): this {
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
            pagePlus: false,
            ellipsisEnd: false,
            end: false
        }
    }

    determineCurrentPages(page: number) {
        this.currentPage = page;
        this.showPaginationLinks = this.initializePaginationLinks();
        if (this.totalPages < 3) {
            // special case: only 2 pages
            // pageMinus is the left page link, which is always one or two
            // pagePlus is the right page link, only shown for three and more pages
            if (page == 1 ) {
                this.pageMinus = page;
                this.pageCenter = page+1;
            }
            else {
                this.pageMinus = page-1;
                this.pageCenter = page;
            }
        } else {
            this.adjustPaginationLinks(page);
            if (page === 1) {
                this.pageMinus = page;
                this.pageCenter = page + 1;
                this.pagePlus = page + 2;
            } else if (page === this.totalPages) {
                this.pageMinus = page - 2;
                this.pageCenter = page - 1;
                this.pagePlus = page;
            } else {
                this.pageMinus = page - 1;
                this.pageCenter = page;
                this.pagePlus = page + 1;
            }
        }
        this.render();
    }

    adjustPaginationLinks(page: number) {
        // control visiblity of first / last page link
        // control visiblity of ellipses at start and end
        this.showPaginationLinks['pagePlus'] = true;
        if (this.showFirstLastPageLink && page > 2) this.showPaginationLinks['start'] = true;
        if (page > 3) this.showPaginationLinks['ellipsisStart'] = true;
        if (this.showFirstLastPageLink && page < this.totalPages-1) this.showPaginationLinks['end'] = true;
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
        'click .pagination-previous': 'clickPrevious',
        'click .pagination-next': 'clickNext',
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