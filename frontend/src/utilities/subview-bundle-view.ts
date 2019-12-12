import { extend, sortedIndexBy } from 'lodash';
import View from '../core/view';

export class SubviewBundleView extends View {
    views: View[] = [];

    /**
     * A simple lookup hash, where each view can be found by an identifier.
     * Identifier can by, for example, the cid of model, e.g. the instance of oa:Annotation.
     */
    viewByIdentifier: Map<string, View> = new Map();

    /**
     * Add a subview to the bundle by appending it to the View's element.
     * @param view The view to add.
     * @param identifier Optional. Will default to the view's model's cid.
     * @param indexValue Optional. If you require binary searching through the subview,
     * supply the value to sort the subviews by here. By default, new views are simply pushed
     * at the end of the existing array.
     */
    addSubview(view: View, identifier?: string, getIndexValue?: (view: View) => number): View {
        if (!identifier) identifier = view.model.cid;
        this.viewByIdentifier.set(identifier, view);
        if (getIndexValue) {
            let index = sortedIndexBy(this.views, view, getIndexValue);
            this.views.splice(index, 0, view);
            this.appendAt(index, view);
        }
        else {
            this.views.push(view);
            view.render().$el.appendTo(this.$el);
        }
        return view;
    }

    /**
     * Append a View into the children of the root element at a certain index.
     */
    appendAt(index: number, view: View): this {
        if (index === 0) {
            this.$el.prepend(view.render().$el);
            return;
        }
        else {
            let existingView = this.$el.children().eq(index);
            if (existingView.length === 0) this.$el.append(view.render().$el);
            else existingView.before(view.render().$el);
        }

        return this;
    }

    /**
     * Remove or detach a view from the bundle.
     * @param view The view to remove or detach.
     * @param identifier Optional. Will default to the view's model's cid.
     * @param detach Optional. Defaults to false.
     */
    deleteSubview(view: View, identifier?: string, detach?: boolean): View {
        if (!identifier) identifier = view.model.cid;
        this.viewByIdentifier.delete(identifier);
        if (detach) view.$el.detach();
        else view.$el.remove();
        return view;
    }

    /**
     * Remove or detach a view from the bundle.
     * @param identifier The identifier of the View-to-be-deleted.
     * @param detach Optional. Defaults to false.
     */
    deleteSubviewBy(identifier: string, detach?: boolean): View {
        let view = this.getViewBy(identifier);
        return this.deleteSubview(view, undefined, detach);
    }

    getViewBy(identifier: string): View {
        return this.viewByIdentifier.get(identifier);
    }
}
extend(SubviewBundleView.prototype, {
    tagName: 'div',
    className: 'subview-bundle',
});
