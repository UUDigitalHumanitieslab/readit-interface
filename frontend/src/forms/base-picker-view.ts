import {
    extend,
    defaultsDeep,
    isEqual,
} from 'lodash';
import {
    ViewOptions as BViewOptions,
} from 'backbone';


import View, { CollectionView } from '../core/view';
import Subject from '../common-rdf/subject';
import Graph from '../common-rdf/graph';
import { getLabel } from '../utilities/linked-data-utilities';
import pickerTemplate from './base-picker-template';

export interface PickerOptionOptions extends BViewOptions<Subject> {
    selected?: boolean;
    label?: string;
}

export class PickerOptionView extends View<Subject> {
    label: string;

    constructor(options: PickerOptionOptions) {
        super(options);
    }

    preinitialize(options: PickerOptionOptions): void {
        if (!options || !options.model) {
            throw new Error('PickerOptionView requires a model');
        }
        let attributes = options.attributes;
        if (!attributes) {
            attributes = this.attributes = (this.attributes || {});
        }
        attributes.value = options.model.id;
    }

    initialize({model, label}: PickerOptionOptions): void {
        this.label = label || getLabel(model);
        this.render();
    }

    render(): this {
        this.$el.text(this.label);
        return this;
    }
}

extend(PickerOptionView.prototype, {
    tagName: 'option',
});

export interface PickerOptions extends BViewOptions<Subject> {
    collection: Graph;
    multiple?: boolean;
}

export default class PickerView extends CollectionView<Subject, PickerOptionView> {
    multiple: boolean;

    constructor(options: PickerOptions) {
        if (!options || !options.collection) {
            throw new Error('PickerView requires a collection');
        }
        super(options);
    }

    preinitialize(options: PickerOptions): void {
        let multiple = options.multiple;
        defaultsDeep(options, {
            className: this.className + (multiple ? ' is-multiple' : ''),
        });
        this.multiple = multiple;
    }

    initialize(options: PickerOptions): void {
        this.initItems().render().initCollectionEvents();
        this.listenTo(this.collection, {
            'request': this.showSpinner,
            'sync error': this.hideSpinner,
        });
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    val(): string | string[];
    val(selection: string | string[]): this;
    val(selection?) {
        const field = this.$('select');
        if (selection != null) {
            if (!isEqual(selection, this.val())) {
                field.val(selection).trigger('change');
            }
            return this;
        } else {
            return field.val();
        }
    }

    forwardChange(event): void {
        this.trigger('change', this, this.val(), event);
    }

    showSpinner(): void {
        this.$el.addClass('is-loading');
    }

    hideSpinner(): void {
        this.$el.removeClass('is-loading');
    }
}

extend(PickerView.prototype, {
    className: 'select readit-picker',
    template: pickerTemplate,
    subview: PickerOptionView,
    container: 'select',
    events: {
        'change': 'forwardChange',
    },
});

if (window['DEBUGGING']) {
    window['PickerView'] = PickerView;
}
