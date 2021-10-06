/**
 * The filter view for the annotation list panel builds on the hierarchy
 * convention from ../hierarchy. Because of that, we only find relatively
 * simple views in this module, which serve as terminal views, as well as a
 * single big function that glues the complete hierarchy view together.
 *
 * We have two kinds of terminals: those that correspond to a (colored)
 * category from the ontology or the NLP ontology and those that represent a
 * broader category such as verified/unverified. The former are visualised with
 * the well-known Label view, while the former are displayed with a much
 * simpler view that is defined within this module.
 *
 * The filter hierarchy and the default settings are requested from the
 * explorer radio channel.
 */

import { extend } from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import View, { CompositeView } from '../core/view';
import Label from '../label/label-view';
import viewHierarchy from '../hierarchy/hierarchy-view';
import explorerChannel from '../explorer/explorer-radio';

import terminalTemplate from './filter-terminal-template';

/**
 * Very basic view for the labels of non-category terminals in the hierarchy.
 */
class PlainLabel extends View {
    initialize(): void {
        this.render();
    }
    render(): this {
        this.$el.text(this.model.get('label'));
        return this;
    }
}

extend(PlainLabel.prototype, {
    tagName: 'span',
});

/**
 * The basic unit of hierarchy operated by the user: a single line with an
 * open/close triangle icon, a checkbox and a label. The icon is only shown if
 * the .model has subcategories and controls whether the subcategories are
 * expanded or collapsed. The checkbox controls whether annotation of the
 * current category are shown (checked) or hidden (unchecked). Hiding a
 * category implies hiding all of its subcategories.
 *
 * Much of the behavior of the hierarchy, including the terminals, is
 * achieved through CSS and through event bindings in the createFilterView
 * function, rather than through logic in the class below.
 */
export class FilterTerminal extends CompositeView {
    hidden: Collection;
    label: View;

    initialize(options): void {
        this.hidden = options.hidden;
        const LabelClass = this.model.has('class') ? Label : PlainLabel;
        this.label = new LabelClass({ model: this.model });
        this.render();
    }

    renderContainer(): this {
        this.$el.html(this.template({
            checked: !this.hidden.has(this.model),
        }));
        return this;
    }

    onToggleCollapse(): void {
        this.trigger('toggleCollapse', this.model);
    }

    onToggleCheck(): void {
        const action = this.$('input').prop('checked') ? 'enable' : 'disable';
        this.trigger(action, this.model);
    }
}

extend(FilterTerminal.prototype, {
    className: 'control',
    template: terminalTemplate,
    subviews: [{
        view: 'label',
        selector: 'label',
    }],
    events: {
        'click .icon': 'onToggleCollapse',
        'change': 'onToggleCheck',
    },
});

/**
 * Create a complete filter view from the ingredients above.
 */
export default function createFilterView() {
    // We fetch the data that we need over the radio. We will next define some
    // callbacks that close over these data.
    const collection = explorerChannel.request('filter-hierarchy');
    const { hidden, collapsed } = explorerChannel.request('filter-settings');

    // Handler for when the user clicks on a triangle icon.
    function toggleCollapse(model: Model): void {
        const action = collapsed.has(model) ? 'remove' : 'add';
        collapsed[action](model);
        this.$el.toggleClass('is-collapsed');
    }

    // Handler for when a checkbox in a terminal is checked.
    function enable(model: Model): void {
        hidden.remove(model);
        const collectionView = this.collectionView;
        if (collectionView) collectionView.$el.prop('disabled', false);
    }

    // Handler for when a checkbox in a terminal is unchecked.
    function disable(model: Model): void {
        hidden.add(model);
        const collectionView = this.collectionView;
        if (collectionView) collectionView.$el.prop('disabled', true);
    }

    // Function to create a single terminal, closing over all of the above.
    function makeItem(model: Model): FilterTerminal {
        if (this.collectionView) {
            this.$el.addClass('has-children');
            if (hidden.has(model)) {
                this.collectionView.$el.prop('disabled', true);
            }
        }
        if (collapsed.has(model)) this.$el.addClass('is-collapsed');
        const terminal = new FilterTerminal({ model, hidden });
        return terminal.on({ toggleCollapse, enable, disable }, this);
    }

    // Glue and go! Note our use of several CSS classes both above and below.
    // See ../style/annotation for their implementation. Also note that we are
    // making the collection views in the hierarchy <viewset> elements, because
    // this enables us to disable all subcategories of a hidden category in one
    // go.
    const view = viewHierarchy({
        collection,
        makeItem,
        compositeOptions: {
            className: 'rit-filter-tree',
        },
        collectionOptions: {
            tagName: 'fieldset',
            className: 'rit-filter-forest',
        },
    });

    // We return the view as well as the collection of settings that the client
    // code is interested in.
    return { view, hidden };
}
