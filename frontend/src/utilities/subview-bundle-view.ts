import { extend, sortedIndexBy } from 'lodash';
import View from '../core/view';
import { BinarySearchContainer } from './binary-searchable-container/binary-search-container';

export class SubviewBundleView extends View {
    private views: View[] = [];

    /**
     * A simple lookup hash, where each view can be found by an identifier.
     * Identifier can by, for example, the cid of model, e.g. the instance of oa:Annotation.
     */
    private viewByIdentifier: Map<string, View> = new Map();

    private binarySearchContainer: BinarySearchContainer;

    bareGetIdentifier: (view: View) => string;

    /**
     * Create a new instance of SubviewBundleView
     * @param getIdentifier Optional. A function that returns a unique identifier for the view supplied (e.g. view.model.cid).
     * Defaults to view.cid.
     * @param getIndexValue Optional. If you require binary searching through / sorting of the subviews,
     * supply a function that returns the index of the supplied view. By default, new views are simply pushed
     * at the end of the existing array.
     */
    constructor(getIdentifier?: (view) => string, getIndexValue?: (view: View) => number) {
        super();
        this.bareGetIdentifier = getIdentifier;
        if (getIndexValue) this.binarySearchContainer = new BinarySearchContainer(getIndexValue);
    }

    /**
     * Get a unique identifier for a View.
     */
    getIdentifier(view: View): string {
        if (this.bareGetIdentifier) return this.bareGetIdentifier(view);
        return view.cid;
    }

    /**
     * Add a subview to the bundle by appending it to the View's element.
     * @param view The view to add.
     **/
    addSubview(view: View): View {
        let identifier = this.getIdentifier(view);
        this.viewByIdentifier.set(identifier, view);
        if (this.binarySearchContainer) {
            let index = this.binarySearchContainer.add(view);
            this.appendAt(index, view);
        }
        else {
            this.views.push(view);
            view.$el.appendTo(this.$el);
        }
        return view;
    }

    /**
     * Insert a View into the root element at a certain index.
     */
    appendAt(index: number, view: View): this {
        if (index === 0) {
            this.$el.prepend(view.$el);
            return;
        }
        else {
            let existingView = this.$el.children().eq(index);
            if (existingView.length === 0) this.$el.append(view.$el);
            else existingView.before(view.$el);
        }

        return this;
    }

    /**
     * Remove or detach a view from the bundle.
     * @param view The view to remove or detach. Should have a model.
     * @param remove Optional. Defaults to false (i.e. subviews are detached).
     */
    deleteSubview(view: View, remove?: boolean): View {
        let identifier = this.getIdentifier(view);
        this.viewByIdentifier.delete(identifier);
        this.binarySearchContainer.remove(view);
        if (remove) view.$el.remove();
        else view.$el.detach();
        return view;
    }

    /**
     * Remove or detach a view from the bundle.
     * @param identifier The identifier of the View-to-be-deleted.
     * @param remove Optional. Defaults to false (i.e. subviews will be detached).
     */
    deleteSubviewBy(identifier: string, remove?: boolean): View {
        let view = this.getViewBy(identifier);
        return view && this.deleteSubview(view, remove);
    }

    getViewBy(identifier: string): View {
        return this.viewByIdentifier.get(identifier);
    }

    getSubviews(): View[] {
        if (this.binarySearchContainer) return this.binarySearchContainer.views;
        return this.views;
    }

    hasSubviews(): boolean {
        if (this.binarySearchContainer) return this.binarySearchContainer.views.length > 0;
        return this.views.length > 0;
    }

    countSubviews(): number {
        if (this.binarySearchContainer) return this.binarySearchContainer.views.length;
        return this.views.length;
    }

    /**
     * Returns the last View with indexValue BEFORE the supplied indexValue, i.e. the nearest smaller one.
     * For example, given 5, from [ 1, 2, 3, 4, 5, 5, 7, 8] it returns 4.
     */
    lastLessThan(indexValue: number): View {
        return this.binarySearchContainer.lastLessThan(indexValue);
    }

    /**
     * Returns the first View with the exact indexValue if it exists,
     * or the View with indexValue BEFORE the supplied indexValue, i.e. the nearest smaller one.
     */
    firstEqualOrLastLessThan(indexValue: number): View {
        return this.binarySearchContainer.firstEqualOrLastLessThan(indexValue);
    }

    /**
     * Returns the first View with indexValue not smaller than the supplied indexValue.
     * For example, given 5, from [ 1, 2, 3, 4, 5, 5, 7, 8] it returns the left 5.
     */
    firstNotLessThan(indexValue: number): View {
        return this.binarySearchContainer.firstNotLessThan(indexValue);
    }

    /**
     * Returns the last View with indexValue not greater than the supplied indexValue.
     * For example, given 5, from [ 1, 2, 3, 4, 5, 5, 7, 8] it returns the right 5.
     */
    lastNotGreaterThan(indexValue: number): View {
        return this.binarySearchContainer.lastNotGreaterThan(indexValue);
    }

    /**
     * Returns the first View with indexValue greater than the supplied indexValue.
     * For example, given 5, from [ 1, 2, 3, 4, 5, 5, 7, 8] it returns 6.
     */
    firstGreaterThan(indexValue: number): View {
        return this.binarySearchContainer.firstGreaterThan(indexValue);
    }
}
extend(SubviewBundleView.prototype, {
    tagName: 'div',
    className: 'subview-bundle',
});
