import { extend, after, constant } from 'lodash';

import View, { CompositeView, ViewOptions as BaseOpt } from '../../core/view';
import FlatItem from '../../annotation/flat-item-model';

import SearchResultSourceView from './search-result-source-view';
import SearchResultItemView from './search-result-item-view';
import searchResultBaseTemplate from './search-result-base-template';

export interface ViewOptions extends BaseOpt {
    /**
     * Specify if the view is selectable. Defaults to true.
     */
    selectable?: boolean;
}

export default class SearchResultView extends CompositeView<FlatItem> {
    selectable: boolean;
    chbSelected: JQuery<HTMLElement>;
    contentView: View;
    activateContent: () => void;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions) {
        this.selectable = (options.selectable === undefined) || options.selectable;
        this.model.when('item', this.setContentView, this);
        this.activateContent = after(2, () => this.contentView.activate());
    }

    setContentView(model: FlatItem): void {
        const ctor = (
            model.has('annotation') ?
            SearchResultSourceView :
            SearchResultItemView
        );
        this.contentView = new ctor({ model }).render();
        this.render().activateContent();
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        if (this.selectable) {
            this.chbSelected = this.$(".chbSelected");
        }
        return this;
    }

    activate(): this {
        this.activateContent();
        // prevent double activation trigger.
        this.activate = constant(this);
        return this;
    }

    isSelected(): boolean {
        return this.chbSelected.is(':checked');
    }

    select(): this {
        // TODO: clean up here (implement both?)
        // this.chbSelected.prop('checked', true);
        this.$el.addClass('is-selected');
        return this;
    }

    unSelect(): this {
        // TODO: clean up here (implement both?)
        // this.chbSelected.prop('checked', false);
        this.$el.removeClass('is-selected');
        return this;
    }

    toggle(): this {
        if (this.isSelected) this.unSelect();
        else this.select();
        return this;
    }

    onClick(event: JQueryEventObject): this {
        this.trigger('click', this);
        return this;
    }
}

extend(SearchResultView.prototype, {
    tagName: 'article',
    className: 'search-result box',
    template: searchResultBaseTemplate,
    subviews: [{
        view: 'contentView',
        selector: '.result-content',
    }],
    events: {
        'click': 'onClick'
    },
});
