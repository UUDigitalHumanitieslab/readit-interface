import { map, some, defaults } from 'lodash';

import { rdfs } from '../core/ns';
import Node from '../core/node';
import Graph from '../core/graph';
import { getRdfSubClasses } from '../utilities/linked-data-utilities';
import FilteredCollection from '../core/filtered-collection';
import PickerView, { PickerOptions } from './base-picker-view';

export interface RangePickerOptions extends PickerOptions {
    model: Node;
}

export default class RangePickerView extends PickerView {
    collection: FilteredCollection<Node, Graph>;
    admittedTypes: string[];

    constructor(options: RangePickerOptions) {
        if (!options || !options.model || !options.collection) {
            throw new Error('RangePickerView requires model and collection');
        }
        super(options);
    }

    initialize(options: RangePickerOptions): void {
        const {model, collection} = options;
        const rangeSubtypes = getRdfSubClasses(model.get(rdfs.range) as Node[]);
        const admittedTypes = map(rangeSubtypes, 'id');
        this.collection = new FilteredCollection(
            collection,
            // Not the most efficient possible filter function.
            n => some(admittedTypes, t => n.has('@type', t)),
        );
        this.admittedTypes = admittedTypes;
        super.initialize(options);
    }
}

if (window['DEBUGGING']) {
    window['RangePickerView'] = RangePickerView;
}
