import { sortedLastIndexBy, sortedIndexBy } from 'lodash';
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
     * AFTER the existing one(s).
     */
    add(searchable: BinarySearchableView): this {
        let index = sortedLastIndexBy(this.searchables, searchable, 'indexValue');
        this.searchables.splice(index, 0, searchable);
        return this;
    }

    /**
     * Remove a searchable from the strategy's list of searchables.
     */
    remove(searchable: BinarySearchableView): this {
        let index = sortedIndexBy(this.searchables, searchable, 'indexValue');
        let lowerBound = sortedIndexBy(this.searchables, searchable, 'indexValue');
        let upperBound = sortedLastIndexBy(this.searchables, searchable, 'indexValue');

        for (let index = lowerBound; index < upperBound; ++index) {
            if (this.searchables[index].view === searchable.view) break;
        }

        if (index < upperBound) this.searchables.splice(index, 1);
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
        if (!searchable || searchable.indexValue !== indexValue) searchable = this.searchables[index - 1];
        return searchable.view;
    }
}
