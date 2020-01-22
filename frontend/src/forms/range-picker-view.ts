import {
    extend,
    assign,
    defaults,
    defaultsDeep,
    map,
    some,
} from 'lodash';
import {
    View as BView,
    ViewOptions as BViewOptions,
} from 'backbone';

import View, { CollectionView } from '../core/view';
import { rdfs } from '../jsonld/ns';
import Node from '../jsonld/node';
import Graph from '../jsonld/graph';
import { getLabel, getRdfSubClasses } from '../utilities/utilities';
import FilteredCollection from '../utilities/filtered-collection';
import pickerTemplate from './range-picker-template';

export interface RangePickerOptionOptions extends BViewOptions<Node> {
    selected?: boolean;
    label?: string;
}

const defaultOptionAttributes = {
    selected: false,
};

export class RangePickerOptionView extends View<Node> {
    label: string;

    constructor(options: RangePickerOptionOptions) {
        super(options);
    }

    preinitialize(options: RangePickerOptionOptions): void {
        if (!options || !options.model) {
            throw new Error('RangePickerOptionView requires a model');
        }
        let attributes = options.attributes;
        if (!attributes) {
            attributes = this.attributes = (this.attributes || {});
        }
        attributes.value = options.model.id;
    }

    initialize({model, label}: RangePickerOptionOptions): void {
        this.label = label || getLabel(model);
        this.render();
    }

    render(): this {
        this.$el.text(this.label);
        return this;
    }
}

extend(RangePickerOptionView.prototype, {
    tagName: 'option',
});

export interface RangePickerOptions extends BViewOptions<Node> {
    model: Node;
    collection: Graph;
    multiple?: boolean;
}

export default class RangePickerView extends CollectionView<Node, RangePickerOptionView> {
    collection: FilteredCollection<Node, Graph>;
    admittedTypes: string[];
    multiple: boolean;

    constructor(options: RangePickerOptions) {
        if (!options || !options.model || !options.collection) {
            throw new Error('RangePickerView requires model and collection');
        }
        super(options);
    }

    preinitialize(options: RangePickerOptions): void {
        let multiple = options.multiple;
        if (multiple == null) multiple = true;
        defaultsDeep(options, {
            multiple,
            className: this.className + (multiple ? ' is-multiple' : ''),
        });
    }

    initialize({model, collection, multiple}: RangePickerOptions): void {
        this.multiple = multiple;
        const rangeSubtypes = getRdfSubClasses(model.get(rdfs.range) as Node[]);
        const admittedTypes = map(rangeSubtypes, 'id');
        this.collection = new FilteredCollection(
            collection,
            // Not the most efficient possible filter function.
            n => some(admittedTypes, t => n.has('@type', t)),
        );
        this.admittedTypes = admittedTypes;
        this.initItems().render().initCollectionEvents();
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    val(): string | string[];
    val(selection: string | string[]): void;
    val(selection?) {
        const field = this.$('select');
        if (selection != null) {
            field.val(selection);
        } else {
            return field.val();
        }
    }

    forwardChange(event): void {
        this.trigger('change', this, this.val(), event);
    }
}

extend(RangePickerView.prototype, {
    className: 'select readit-range-picker',
    template: pickerTemplate,
    subview: RangePickerOptionView,
    container: 'select',
    events: {
        'change': 'forwardChange',
    },
});

if (window['DEBUGGING']) {
    window['RangePickerView'] = RangePickerView;
}
