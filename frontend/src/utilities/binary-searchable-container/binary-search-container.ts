import { sortedLastIndexBy, sortedIndexBy, bind } from 'lodash';
import View from "../../core/view";


class FakeView extends View {
    indexValue: number;
    constructor(indexValue: number) {
        super();
        this.indexValue = indexValue;
    }
}

export class BinarySearchContainer {
    views: View[];
    bareGetIndexValue: (view: View) => number;

    constructor(getIndexValue: (view: View) => number) {
        this.views = [];
        this.bareGetIndexValue = getIndexValue;
    }

    /**
     * Add a view to the container's list of views.
     * The new view will be added at the index corresponding to its indexValue.
     * Note that if an indexValue already exists, the new view will be added
     * AFTER the existing one(s).
     * Return the index at which view was inserted.
     */
    add(view: View): number {
        let index = sortedLastIndexBy(this.views, view, this.bareGetIndexValue);
        this.views.splice(index, 0, view);
        return index;
    }

    /**
     * Remove a view from the container's list of views.
     */
    remove(view: View): this {
        let index;
        let lowerBound = sortedIndexBy(this.views, view, this.bareGetIndexValue);
        let upperBound = sortedLastIndexBy(this.views, view, this.bareGetIndexValue);

        for (index = lowerBound; index < upperBound; ++index) {
            if (this.views[index] === view) break;
        }

        if (index < upperBound) this.views.splice(index, 1);
        return this;
    }

    /**
     * Helper function to fo find an index without having an instance of View. i.e. only an indexValue.
     */
    getIndexValue(view: View): number {
        if (view instanceof FakeView) {
            return view.indexValue;
        }
        else return this.bareGetIndexValue(view);
    }

    /**
     * Returns the last View with indexValue BEFORE the supplied indexValue, i.e. the nearest smaller one.
     * For example, given 5, from [ 1, 2, 3, 4, 5, 5, 7, 8] it returns 4.
     */
    lastLessThan(indexValue: number): View {
        let index = sortedIndexBy(this.views, new FakeView(indexValue), this.getIndexValue.bind(this));
        return this.views[index - 1];
    }

    /**
     * Returns the first View with the exact indexValue if it exists,
     * or the View with indexValue BEFORE the supplied indexValue, i.e. the nearest smaller one.
     */
    firstEqualOrLastLessThan(indexValue: number): View {
        let view = this.firstNotLessThan(indexValue);
        if (view && indexValue == this.bareGetIndexValue(view)) return view;
        return this.lastLessThan(indexValue);
    }

    /**
     * Returns the first View with indexValue not smaller than the supplied indexValue.
     * For example, given 5, from [ 1, 2, 3, 4, 5, 5, 7, 8] it returns the left 5.
     */
    firstNotLessThan(indexValue: number): View {
        let index = sortedIndexBy(this.views, new FakeView(indexValue), this.getIndexValue.bind(this));
        return this.views[index];
    }

    /**
     * Returns the last View with indexValue not greater than the supplied indexValue.
     * For example, given 5, from [ 1, 2, 3, 4, 5, 5, 7, 8] it returns the right 5.
     */
    lastNotGreaterThan(indexValue: number): View {
        let index = sortedLastIndexBy(this.views, new FakeView(indexValue), this.getIndexValue.bind(this));
        return this.views[index - 1];
    }

    /**
     * Returns the first View with indexValue greater than the supplied indexValue.
     * For example, given 5, from [ 1, 2, 3, 4, 5, 5, 7, 8] it returns 6.
     */
    firstGreaterThan(indexValue: number): View {
        let index = sortedLastIndexBy(this.views, new FakeView(indexValue), this.getIndexValue.bind(this));
        return this.views[index];
    }
}
