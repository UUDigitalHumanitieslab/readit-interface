import { map, some, defaults } from 'lodash';

import { rdfs } from '../jsonld/ns';
import Node from '../jsonld/node';
import Graph from '../jsonld/graph';
import { getRdfSubClasses } from '../utilities/utilities';
import FilteredCollection from '../utilities/filtered-collection';
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
        defaults(options, { multiple: true });
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
