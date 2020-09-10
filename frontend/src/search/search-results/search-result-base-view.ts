import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';

import View from '../../core/view';
import { oa } from '../../jsonld/ns';
import Node from '../../jsonld/node';
import FlatItem from '../../annotation/flat-item-model';
import { isType } from '../../utilities/utilities';

import SearchResultSourceView from './search-result-source-view';
import SearchResultItemView from './search-result-item-view';
import searchResultBaseTemplate from './search-result-base-template';

export interface ViewOptions extends BaseOpt<Node> {
    model: Node;
    /**
     * Specify if the view is selectable. Defaults to true.
     */
    selectable?: boolean;
}

export default class SearchResultBaseItemView extends View<Node> {
    selectable: boolean;
    chbSelected: JQuery<HTMLElement>;
    contentView: View;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.selectable = (options.selectable === undefined) || options.selectable;

        if (isType(this.model, oa.Annotation)) {
            this.contentView = new SearchResultSourceView({
                model: new FlatItem(options.model),
            });
        } else this.contentView = new SearchResultItemView({
            model: options.model,
        });
        this.contentView.render();

        return this;
    }

    render(): this {
        if (this.contentView) this.contentView.$el.detach();
        this.$el.html(this.template(this));
        if (this.contentView) this.$('.result-content').append(this.contentView.el);

        if (this.selectable) {
            this.chbSelected = this.$(".chbSelected");
        }

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
extend(SearchResultBaseItemView.prototype, {
    tagName: 'article',
    className: 'search-result box',
    template: searchResultBaseTemplate,
    events: {
        'click': 'onClick'
    }
});
