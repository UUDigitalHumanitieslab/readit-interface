import { extend, sortedIndexBy } from 'lodash';
import View from '../core/view';

export class SubviewBundleView extends View {
    views: View[] = [];

    /**
     * A simple lookup hash, where each view can be found by an identifier.
     * Identifier can by, for example, the cid of model, e.g. the instance of oa:Annotation.
     */
    viewByIdentifier: Map<string, View> = new Map();

    bareGetIdentifier: (view: View) => string;
    getIndexValue: (view: View) => number;

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
        this.getIndexValue = getIndexValue;
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
        if (this.getIndexValue) {
            let index = sortedIndexBy(this.views, view, this.getIndexValue);
            this.views.splice(index, 0, view);
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
        return this.deleteSubview(view, remove);
    }

    getViewBy(identifier: string): View {
        return this.viewByIdentifier.get(identifier);
    }
}
extend(SubviewBundleView.prototype, {
    tagName: 'div',
    className: 'subview-bundle',
});
