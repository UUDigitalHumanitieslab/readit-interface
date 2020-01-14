import { extend, assign, defaults } from 'lodash';
import {
    View as BView,
    ViewOptions as BViewOptions,
} from 'backbone';

import View from '../core/view';
import Node from '../jsonld/node';
import { getLabel } from '../utilities/utilities';

const defaultOptionAttributes = {
    selected: false,
};

export class RangePickerOptionView extends View<Node> {
    preinitialize({attributes, model}): void {
        defaults(attributes, defaultOptionAttributes, {
            label: getLabel(model),
        });
        attributes.value = model.id;
    }
}

extend(RangePickerOptionView.prototype, {
    tagName: 'select',
});

export interface RangePickerOptions extends BViewOptions {
    multiple?: boolean;
}

export default class RangePickerView extends View {
    multiple: boolean;

    constructor(options?: RangePickerOptions) {
        super(options);
    }
}
