import { extend, assign, defaults, defaultsDeep } from 'lodash';
import {
    View as BView,
    ViewOptions as BViewOptions,
} from 'backbone';

import View from '../core/view';
import Node from '../jsonld/node';
import Graph from '../jsonld/graph';
import { getLabel } from '../utilities/utilities';

const defaultOptionAttributes = {
    selected: false,
};

export class RangePickerOptionView extends View<Node> {
    preinitialize(options?: BViewOptions): void {
        if (!options || !options.model) {
            throw new Error('RangePickerOptionView requires a model');
        }
        let attributes = options.attributes;
        if (!attributes) {
            attributes = self.attributes = (self.attributes || {});
        }
        defaults(attributes, defaultOptionAttributes, {
            label: getLabel(options.model),
        });
        attributes.value = model.id;
    }
}

extend(RangePickerOptionView.prototype, {
    tagName: 'select',
});

export interface RangePickerOptions extends BViewOptions<Node> {
    collection: Graph;
    multiple?: boolean;
}

export default class RangePickerView extends View<Node> {
    collection: Graph;

    constructor(options?: RangePickerOptions) {
        super(options);
    }

    preinitialize(options?: RangePickerOptions): void {
        if (!options) return;
        if (!options.multiple) return;
        defaultsDeep(options, {
            attributes: {
                multiple: true,
            },
        });
    }
}
