import { extend } from 'lodash';

import Collection from '../core/collection';
import { CompositeView } from '../core/view';
import Multifield, { RowManagingView } from '../forms/multifield-view';
import Subject from '../common-rdf/subject';

import fieldEditingTemplate from './field-editing-template';

// Selector of the .control that contains the save button.
const saveControl = '.panel-footer .control:first-child';

// Allow prototype property access in the Handlebars runtime (needed as of 4.6).
// This setting should be safe because it doesn't allow `.constructor`.
// See also https://mahmoudsec.blogspot.com/2019/04/handlebars-template-injection-and-rce.html.
const templateOptions = {
    allowProtoPropertiesByDefault: true,
};

export interface ChangeManagingView extends RowManagingView {
    changes: Collection;
    commitChanges(): PromiseLike<void>;
}

/**
 * Abstract base view for panels that let the user edit a variable number of
 * features on the model. Subclasses should define the `.rowManager` and define
 * `this.title` before calling `super.initialize()`.
 */
export default class FieldEditingPanel extends CompositeView<Subject> {
    rowManager: ChangeManagingView;
    multifield: Multifield;
    title: string;

    initialize(): void {
        this.rowManager.changes.on('add', this.resetIndicators, this);
        this.multifield = new Multifield({
            collectionView: this.rowManager,
            className: 'panel-content',
        });
        this.render();
    }

    renderContainer(): this {
        this.$el.html(this.template(this, templateOptions));
        return this;
    }

    resetIndicators(): this {
        this.$(`${saveControl} button`)
            .removeClass('is-loading is-success is-danger')
            .children('.icon').remove();
        this.multifield.addButton.enable();
        return this;
    }

    indicateProgress(): this {
        this.resetIndicators();
        this.$(`${saveControl} button`).addClass('is-loading');
        this.multifield.addButton.disable();
        return this;
    }

    indicateSuccess(): this {
        this.resetIndicators();
        this.$(`${saveControl} button`).addClass('is-success').append(`
            <span class="icon is-right"><i class="fas fa-check"></i></span>
        `);
        return this;
    }

    indicateError(): this {
        this.resetIndicators();
        this.$(`${saveControl} button`).addClass('is-danger').append(`
            <span class="icon is-right">
                <i class="fas fa-exclamation-triangle"></i>
            </span>
        `);
        return this;
    }

    submit(event: JQuery.TriggeredEvent): this {
        event.preventDefault();
        if (this.rowManager.changes.isEmpty()) return this;
        this.indicateProgress().rowManager.commitChanges().then(
            this.indicateSuccess.bind(this),
            this.indicateError.bind(this),
        );
        return this;
    }

    close(): this {
        return this;
    }
}

extend(FieldEditingPanel.prototype, {
    tagName: 'form',
    className: 'explorer-panel',
    template: fieldEditingTemplate,
    subviews: [{
        view: 'multifield',
        selector: '.panel-header',
        method: 'after',
    }],
    events: {
        reset: 'close',
        submit: 'submit',
    },
});
