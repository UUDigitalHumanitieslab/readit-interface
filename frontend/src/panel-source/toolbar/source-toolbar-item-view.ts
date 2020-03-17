import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from './../../core/view';

import template from './source-toolbar-item-template';

/**
 * An item in the toolbar with an icon and a tooltip.
 * If it is clicked, an event will be fired with the specified name.
 */
export type SimpleToolbarItem = {
    icon: string;
    tooltip: string;
    clickedEventName: string;
}

/**
 * A toolbar item that toggles between two icons and respective tooltip messages.
 * The item at index 0 is considered the primary item and will be displayed first.
 * Any items beyond the first two will be ignored.
 */
export type TogglingToolbarItem = {
    items: SimpleToolbarItem[];
}

export interface ViewOptions extends BaseOpt {
    item: SimpleToolbarItem | TogglingToolbarItem;
}

export default class SourceToolbarItemView extends View {
    primaryItem: SimpleToolbarItem;
    secondaryItem: SimpleToolbarItem;
    hasSecondaryItemDisplaying: boolean;

    constructor(options?: ViewOptions) {
        super(options);
        if (this.isSimpleToolbarItem(options.item)) {
            this.primaryItem = options.item as SimpleToolbarItem;
        }
        else {
            this.primaryItem = (options.item as TogglingToolbarItem).items[0];
            this.secondaryItem = (options.item as TogglingToolbarItem).items[1];
        }
    }

    initialize(options?: ViewOptions): this {
        return this;
    }

    render(): this {
        this.$el.html(this.template(this));
        this.setTooltip(this.primaryItem.tooltip);
        this.setIcon(this.primaryItem.icon);
        return this
    }

    setIcon(icon: string): this {
        let element = this.$(`#${this.cid}icon`);
        element.removeClass();
        element.addClass(`fas ${icon} fa-lg`);
        return this;
    }

    setTooltip(tooltip: string): this {
        this.$el.removeAttr('data-tooltip');
        this.$el.attr('data-tooltip', tooltip);
        return this;
    }

    /**
     * Check if item is a SimpleToolbarItem. If it isn't it is a TogglingToolbarItem.
     * @param item Optional. If undefined, just checks if a secondaryItem exists on the view.
     */
    isSimpleToolbarItem(item?: SimpleToolbarItem | TogglingToolbarItem): boolean {
        if (item) return (item as SimpleToolbarItem).icon !== undefined;
        return this.secondaryItem == undefined;
    }

    toggleItems(): this {
        if (this.hasSecondaryItemDisplaying) {
            this.setTooltip(this.primaryItem.tooltip);
            this.setIcon(this.primaryItem.icon);
        }
        else {
            this.setTooltip(this.secondaryItem.tooltip);
            this.setIcon(this.secondaryItem.icon);
        }
        this.hasSecondaryItemDisplaying = !this.hasSecondaryItemDisplaying;
        return this;
    }

    onClick(): this {
        if (this.isSimpleToolbarItem()) {
            // toggle selected
            this.trigger(this.primaryItem.clickedEventName);
        }
        else {
            let hadSecondaryItemDisplaying = this.hasSecondaryItemDisplaying;
            this.toggleItems();
            if (hadSecondaryItemDisplaying) {
                this.trigger(this.secondaryItem.clickedEventName);
            }
            else {
                this.trigger(this.primaryItem.clickedEventName);
            }
        }
        return this;
    }
}
extend(SourceToolbarItemView.prototype, {
    tagName: 'div',
    className: 'toolbar-item toolbar-highlight-clicking tooltip is-tooltip-left',
    template: template,
    events: {
        'click': 'onClick',
    }
});
