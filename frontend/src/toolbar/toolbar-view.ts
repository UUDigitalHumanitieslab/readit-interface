import { extend } from 'lodash';
import View from '../core/view';

import SourceToolbarItemView from './toolbar-item-view';

import template from './toolbar-template';

export default class SourceToolbarView extends View {

    highlightModeToolbarItem: SourceToolbarItemView;

    initialize(): this {
        let items = [
            { icon: 'fa-hand-pointer', tooltip: 'Allow clicking of highlights (i.e. to open their details)', clickedEventName: 'clickingMode'},
            { icon: 'fa-i-cursor', tooltip: 'Allow selection of text in highlights.', clickedEventName: 'textSelectionMode' }
        ]
        this.highlightModeToolbarItem = new SourceToolbarItemView({ item: { items: items }});
        this.listenTo(this.highlightModeToolbarItem, 'clickingMode', this.onHighlightClickingMode);
        this.listenTo(this.highlightModeToolbarItem, 'textSelectionMode', this.onHighlightTextSelectionMode);
        this.listenTo(this.model, 'change', this.toggleToolbarItemSelected)
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
        if (this.model.get('annotations')===true) {
            this.$(`.toolbar-annotations`).addClass("is-active");
        }
        this.$('toolbar-highlight-mode').replaceWith(this.highlightModeToolbarItem.render().$el);
        return this
    }

    remove(): this {
        this.highlightModeToolbarItem.remove();
        return this;
    }

    /**
     * Toggle highlights on and off.
     */
    toggleHighlights(): this {
        this.model.set('annotations', !this.model.get('annotations'));
        return this;
    }

    toggleMetadata(): this {
        this.model.set('metadata', !this.model.get('metadata'));
        return this;
    }

    toggleToolbarItemSelected(): this {
        const name = Object.keys(this.model.changed)[0];
        this.$(`.toolbar-${name}`).toggleClass("is-active");
        return this;
    }
}
extend(SourceToolbarView.prototype, {
    tagName: 'div',
    className: 'toolbar',
    template: template,
    events: {
        'click .toolbar-metadata': 'toggleMetadata',
        'click .toolbar-annotations': 'toggleHighlights',
    }
});
