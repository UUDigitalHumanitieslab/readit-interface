import { extend } from 'lodash';

import View, {ViewOptions as BaseOpt} from '../core/view';

import PaginationTemplate from './pagination-template';

export interface ViewOptions extends BaseOpt {
    totalPages: number;
}

export default class PaginationView extends View {
    totalPages: number;
    showPaginationLinks: PaginationLinks;
    page: number;
    pagePlus: number;
    pageMinus: number;

    initialize(options: ViewOptions) {
        this.totalPages = options.totalPages;
        this.determineCurrentPages(1);
    }

    render(): this {
        this.$el.html(this.template(this));
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
        this.showPaginationLinks = this.initializePaginationLinks();
        $('.pagination-link').removeClass('is-current');
        if (this.totalPages < 3) {
            this.pageMinus = page;
            this.page = 2;
            $('#page-minus').addClass('is-current');
        }
        else {
            this.showPaginationLinks['pagePlus'] = true;
            if (page === 1) {
                $('.pagination-previous').attr('disabled', 'true');
                this.pageMinus = page;
                this.page = page + 1;
                this.pagePlus = page + 2;
                $('#page-minus').addClass('is-current');
            } else if (page === this.totalPages) {
                $('.pagination-next').attr('disabled', 'true');
                this.pageMinus = page - 2;
                this.page = page - 1;
                this.pagePlus = page;
                $('#page-plus').addClass('is-current');
            } else {
                $('.btn').attr('disabled', 'false');
                this.pageMinus = page - 1;
                this.page = page;
                this.pagePlus = page + 1;
                $('#page').addClass('is-current');
                if (page > 3) this.showPaginationLinks['start'] = true;
                if (page > 4) this.showPaginationLinks['ellipsis-start'] = true;
                if (this.totalPages > 3 && page < this.totalPages-1) this.showPaginationLinks['end'] = true;
                if (page < this.totalPages-2) this.showPaginationLinks['ellipsis-end'] = true;
            }
        }
        this.render();
    }

    clickPrevious() {
        this.triggerSearch(this.page-1);
    }

    clickNext() {
        this.triggerSearch(this.page+1);
    }

    clickPageMinus() {
        this.triggerSearch(this.pageMinus);
    }

    clickPage() {
        this.triggerSearch(this.page);
    }

    clickPagePlus() {
        this.triggerSearch(this.pagePlus);
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
        'click #page-minus': 'clickPageMinus',
        'click #page': 'clickPage',
        'click #page-plus': 'clickPagePlus'
    }
});

interface PaginationLinks {
    start: boolean;
    ellipsisStart: boolean
    pagePlus: boolean
    ellipsisEnd: boolean
    end: boolean
}