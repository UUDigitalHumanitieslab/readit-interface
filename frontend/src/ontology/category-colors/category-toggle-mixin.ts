import { map } from 'lodash';

// Generate two similar utility functions that return a prefixed version of a
// CSS class name.
function createPrepender(prefix: string) {
    return function(suffix: string): string {
        return `${prefix}-${suffix}`;
    }
}
const prependHide = createPrepender('hide');
const prependUnhide = createPrepender('unhide');

// A constant that we use in `whitelist` below. Whitelist-based toggling
// requires hiding everything that isn't in the whitelist and this CSS class
// takes care of that.
const excludeAll = ['hide-rit-any'];

// Return a space-separated list of CSS class names that will result in all
// internal elements with ontology category classes that are *not* in `classes`
// being hidden.
function whitelist(classes: string[]): string {
    return excludeAll.concat(map(classes, prependUnhide)).join(' ');
}

// Return a space-separated list of CSS class names that will result in all
// internal elements with ontology category classes that are in `classes` being
// hidden.
function blacklist(classes: string[]): string {
    return map(classes, prependHide).join(' ');
}

/**
 * Mixin for view classes that enables them to selectively hide internal
 * elements with particular ontology category CSS classes.
 *
 * The hiding and unhiding is purely CSS-based, so no JavaScript DOM or view
 * traversal is required. This does require that a rendered instance of
 * CategoryColorsView is present in the document.
 *
 * For an example of how to apply mixins in general, look for DEMO MARKER in
 * the unittest next to this module.
 */
export default class CategoryToggleMixin {
    _toggledCategories: string;

    // We re-declare the $el property from Backbone.View to help TypeScript.
    $el: JQuery;

    /**
     * Hide or unhide particular ontology categories within the view.
     *
     * If passed, `include` must be a list of category CSS classes and
     * specifies a whitelist (categories that should not be hidden). If
     * `include` is `null` or `undefined`, `exclude` is instead used as a
     * blacklist. If `include` is an empty list, all categories are hidden. If
     * no arguments are passed, all categories are un-hidden.
     *
     * There is no memory effect. Calling this method multiple times has the
     * same overall effect as the last call alone.
     *
     * Returns the view so you can continue chaining other methods.
     */
    toggleCategories(include?: string[], exclude?: string[]): this {
        let toggled = this._toggledCategories;
        if (toggled) this.$el.removeClass(toggled);
        toggled = (
            include ? whitelist(include) :
            exclude ? blacklist(exclude) :
            ''
        );
        this.$el.addClass(toggled);
        this._toggledCategories = toggled;
        return this;
    }
}
