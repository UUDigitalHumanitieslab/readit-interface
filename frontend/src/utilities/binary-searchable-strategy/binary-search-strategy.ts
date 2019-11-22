import { sortedIndexBy } from 'lodash';
import View from "../../core/view";

export type BinarySearchableView = {
    indexValue: number,
    view: View
}

export class BinarySearchStrategy {
    searchables: BinarySearchableView[];

    constructor() {
        this.searchables = [];
    }

    /**
     * Add a searchable to the strategy's list of searchables.
     * The new searchable will be added at the index corresponding to its indexValue.
     * Note that if an indexValue already exists, the new searchable will be added
     * BEFORE the existing one(s).
     */
    add(searchable: BinarySearchableView): this {
        let index = sortedIndexBy(this.searchables, searchable, 'indexValue');
        this.searchables.splice(index, 0, searchable);
        return this;
    }

    /**
     * Get the View closest to an indexValue. 'Closest to' here means the value
     * before the supplied indexValue, i.e. the nearest smaller one.
     */
    getClosestTo(indexValue: number): View {
        let fakeSearchable = {
            indexValue: indexValue,
            view: null
        }
        let index = sortedIndexBy(this.searchables, fakeSearchable, 'indexValue');
        let searchable = this.searchables[index];
        if (searchable.indexValue !== indexValue) searchable = this.searchables[index - 1];
        return searchable.view;
    }
}
