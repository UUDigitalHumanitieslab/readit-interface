import { extend } from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import View, { CompositeView } from '../core/view';
import Label from '../label/label-view';
import viewHierarchy from '../hierarchy/hierarchy-view';
import explorerChannel from '../explorer/explorer-radio';

import terminalTemplate from './filter-terminal-template';

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
        const action = this.$('input').val() ? 'enable' : 'disable';
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

export default function createFilterView(): View {
    const collection = explorerChannel.request('filter-hierarchy');
    const hidden = new Collection();
    const collapsed = new Collection();
    function toggleCollapse(model: Model): void {
        const action = collapsed.has(model) ? 'remove' : 'add';
        collapsed[action](model);
        this.$el.toggleClass('is-collapsed');
    }
    function enable(model: Model): void {
        hidden.remove(model);
        const collectionView = this.collectionView;
        if (collectionView) collectionView.$el.prop('disabled', false);
    }
    function disable(model: Model): void {
        hidden.add(model);
        const collectionView = this.collectionView;
        if (collectionView) collectionView.$el.prop('disabled', true);
    }
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
    return view.listenTo(hidden, 'all', view.trigger);
}
