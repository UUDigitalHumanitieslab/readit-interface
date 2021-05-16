import { extend } from 'lodash';

import {
    CompositeView,
    CollectionView,
    ViewOptions as BViewOptions,
} from '../core/view';

import AddButton from './add-button-view';
import multifieldTemplate from './multifield-template';

/**
 * A Multifield takes care of showing an "add" button as a final row. It defers
 * the management of the actual rows to a subview, which is expected to have
 * the type below.
 */
export interface RowManagingView extends CollectionView {
    addRow(): void;
}

/**
 * For the above reason, the subview in question must be passed as a
 * constructor argument.
 */
export interface ViewOptions extends BViewOptions {
    collectionView: RowManagingView;
}

/**
 * A simple composition: rowmanager with zero or more rows on top,
 * add button below.
 */
export default class Multifield extends CompositeView {
    collectionView: RowManagingView;
    addButton: AddButton;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): void {
        this.collectionView = options.collectionView;
        this.collectionView.$el.addClass('field');
        this.listenTo(this.collectionView, 'all', this.trigger);
        this.addButton = new AddButton().on(
            'click', this.collectionView.addRow, this.collectionView
        );
        this.render();
    }

    activate(): this {
        this.collectionView.activate();
        return this;
    }

    renderContainer(): this {
        this.$el.html(this.template({}));
        return this;
    }
}

extend(Multifield.prototype, {
    className: 'rit-multifield',
    template: multifieldTemplate,
    subviews: [{
        view: 'collectionView',
        method: 'prepend',
    }, {
        view: 'addButton',
        selector: '.rit-add-row',
    }],
});
