import { bind, assign } from 'lodash'
import { View as BView, ViewOptions as BViewOptions } from 'backbone';
import {
    CompositeView as BCompositeView,
    CollectionView as BCollectionView,
} from 'backbone-fractal';
import { TemplateDelegate } from 'handlebars';

import Model from './model';
import Collection from './collection';

export interface ViewOptions extends BViewOptions<Model> {
    model?: Model;
    collection?: Collection;
}

/**
 * This is the base view class that all views in the application
 * should derive from, either directly or indirectly. If you want to
 * apply a customization to all views in the application, do it here.
 */
export default class View<M extends Model = Model> extends BView<M> {
    template: TemplateDelegate;
    extraLoggingInfo: any;

    constructor(options?) {
        super(options);

        if (window['DEBUGGING'])
            this.$el.on('click', bind(this.onBaseClick, this));
    }

    onBaseClick(event: JQueryEventObject): this {
        if (event.altKey) {
            this.logInfo();
        }
        return this;
    }

    logInfo(): this {
        if (this.cid == "view1") return this; // ignore internalLinkEnabler
        console.log(this);
        if (this.extraLoggingInfo) console.log(this.extraLoggingInfo);
        return this;
    }

    /**
     * All views have an `activate` method which can be called to signal to the
     * view that it was attached to the document. By default, it is a no-op;
     * views that actually depend on DOM insertion, for example for size or
     * position calculations, may override it to do something meaningful.
     */
    activate(): this {
        return this;
    }
}

/**
 * CompositeView derives both from our own customized View base class
 * and from the BCompositeView we imported from backbone-fractal.
 * TypeScript does not easily accept this. To make it work, we take a
 * three-step approach:
 *
 *  1. Define the child class as extending only one of the two parent
 *     classes. We take View in this case, because BCompositeView is
 *     easier to add as a mixin afterwards.
 *  2. Declare an interface with the same name as the child class
 *     (CompositeView), which extends the other base class
 *     (BCompositeView). TypeScript then understands that we are
 *     really talking about a single type that extends two base
 *     classes at the same time. This is called declaration merging.
 *  3. Mix BCompositeView into CompositeView, i.e., copy the
 *     prototype properties from the former to the latter. Where the
 *     previous step ensured that TypeScript understands what is
 *     going on, this final step ensures that it is actually true.
 */
// step 1: define class with the first parent class
export class CompositeView<M extends Model = Model> extends View<M> {
    /**
     * Properly dispose of a subview in cases where it is outlived by the
     * parent view. This ensures that the .remove()d subview cannot
     * accidentally be reinserted in the parent HTML.
     */
    dispose<Name extends keyof this>(subviewName: Name): this {
        const subview = this[subviewName];
        if (subview instanceof BView) {
            subview.remove();
            delete this[subviewName];
        } else if (subview != null) {
            console.warn(`Trying to dispose non-subview ${subviewName}`, this);
        }
        return this;
    }
}

// step 2: declare interface with the second parent class
export interface CompositeView<M extends Model = Model> extends BCompositeView<M> {
    // We re-declare two member functions of CompositeView because
    // otherwise, TypeScript cannot deduce their types.
    render(): this;
    remove(): this;
}

// step 3: perform the actual mixin
assign(CompositeView.prototype, BCompositeView.prototype);

/**
 * CollectionView derives both from our customized View base class
 * and from the BCollectionView we imported from backbone-fractal. We
 * take the same three-step approach as with CompositeView, see above.
 *
 * A note on notation. The following pattern:

    class C<T extends X = Y> extends D<T> {}

 * uses the word "extends" in two different meanings. It should be
 * interpreted as follows:
 *
 *   - We are defining a class, called C.
 *   - C derives from another class that is called D.
 *   - Both C and D are generic classes. T is their type parameter.
 *   - "T extends X" is a so-called type constraint: T must be a
 *     subtype of X.
 *   - The "= Y" part means that T defaults to Y. So if somebody
 *     writes myC = new C(), without specifying the type parameter,
 *     TypeScript will interpret this as myC = new C<Y>().
 *
 * The CollectionView class we define below (in three steps as
 * explained before) has *two* type parameters: M, the type of its
 * .model, and SV, the type of its .subview.
 */
// step 1: define class with the first parent class
export class CollectionView<M extends Model = Model, SV extends BView = View> extends View<M> {
    initialize(options?): void {}
    preinitialize(options?): void {}
}

// step 2: declare interface with the second parent class
export interface CollectionView<M extends Model = Model, SV extends BView = View> extends BCollectionView<SV> {
    // re-declaring the types of the members to help TypeScript
    model: M;
    collection: Collection<M>;
    render(): this;
    remove(): this;
    // SomeType<TypeParam>['someName'] means "the type of the
    // .someName property of instances of type SomeType<TypeParam>".
    setElement: View<M>['setElement'];
    delegate: View<M>['delegate'];
    undelegate: View<M>['undelegate'];
}

// step 3: perform the actual mixin
assign(CollectionView.prototype, BCollectionView.prototype);
