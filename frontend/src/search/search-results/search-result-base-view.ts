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
        this.listenTo(this.model, {
            focus: this.highlight,
            blur: this.unhighlight,
        });
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
        this.chbSelected.prop('checked', true);
        return this;
    }

    unSelect(): this {
        this.chbSelected.prop('checked', false);
        return this;
    }

    toggle(): this {
        return this.isSelected ? this.unSelect() : this.select();
    }

    highlight(): void {
        this.$el.addClass('is-highlighted');
    }

    unhighlight(): void {
        this.$el.removeClass('is-highlighted');
    }

    onClick(): void {
        this.model.trigger(
            this.$el.hasClass('is-highlighted') ? 'blur' : 'focus',
            this.model
        );
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
