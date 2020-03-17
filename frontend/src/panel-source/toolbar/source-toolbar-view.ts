import { ViewOptions } from 'backbone';
import { extend } from 'lodash';
import View from './../../core/view';

import SourceToolbarItemView from './source-toolbar-item-view';

import template from './source-toolbar-template';

export default class SourceToolbarView extends View {

    highlightModeToolbarItem: SourceToolbarItemView;

    constructor(options?: ViewOptions) {
        super(options);

    }

    initialize(options?: ViewOptions): this {
        let items = [
            { icon: 'fa-hand-pointer', tooltip: 'Allow clicking of highlights (i.e. to open their details)', clickedEventName: 'clickingMode'},
            { icon: 'fa-i-cursor', tooltip: 'Allow selection of text in highlights.', clickedEventName: 'textSelectionMode' }
        ]
        this.highlightModeToolbarItem = new SourceToolbarItemView({ item: { items: items }});
        this.listenTo(this.highlightModeToolbarItem, 'clickingMode', this.onHighlightClickingMode);
        this.listenTo(this.highlightModeToolbarItem, 'textSelectionMode', this.onHighlightTextSelectionMode);

        return this;
    }

    onHighlightClickingMode(): this {
        return this.trigger('highlightClickingMode');
    }

    onHighlightTextSelectionMode(): this {
        return this.trigger('highlightTextSelectionMode');
    }

    render(): this {
        this.$el.html(this.template(this));
        this.$('toolbar-highlight-mode').replaceWith(this.highlightModeToolbarItem.render().$el);
        return this
    }
}
extend(SourceToolbarView.prototype, {
    tagName: 'div',
    className: 'toolbar',
    template: template,
    events: {
    }
});
