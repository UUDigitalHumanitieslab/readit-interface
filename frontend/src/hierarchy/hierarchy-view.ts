/**
 * Occasionally, we need to create hierarchical, potentially recursive views to
 * represent some underlying tree of data. In this module, we define reusable
 * components that encapsulate the hierarchy and recursion. Users can compose
 * these with their own terminal views in order to arrive at a full
 * representation of the hierarchy.
 *
 * The rendering of the hierarchy (i.e., the view layer defined in this
 * module) builds on the following convention for modeling the hierarchy (i.e.,
 * the model layer as it is passed to the view layer). Data may need to be
 * transformed to this convention before passing them to the view hierarchy.
 * The model layer consists of three types of elements: outer models, inner
 * models and collections. Outer models are "plain" Backbone models that have
 * only two optional attributes, which are named 'model' and 'collection',
 * containing respectively an inner model and a collection, if set. Inner
 * models are free-form models, representing the actual payload of the
 * hierarchy. Collections consist of outer models, thus completing a recursive,
 * tree-like structure.
 *
 * Consider the following example of a hierarchy of senses, where models are
 * represented by objects and collections by arrays. In this example, the inner
 * models simply consist of a single 'id' attribute. They could however be
 * models of arbitrary complexity, even mixing several different types of
 * models within the same hierarchy. The important thing to recognize is that
 * the inner models are not recursively traversed in order to determine the
 * hierarchy; recursion is the sole purpose of the outer models.
 *
 *     {
 *         model: { id: 'senses' }
 *         collection: [{
 *             model: { id: 'flavors' },
 *             collection: [{
 *                 model: { id: 'vanilla' },
 *             }, {
 *                 model: { id: 'chocolate' },
 *             }],
 *         }, {
 *             model: { id: 'colors' },
 *             collection: [{
 *                 model: { id: 'red' },
 *             }, {
 *                 model: { id: 'blue' },
 *             }],
 *         }],
 *     }
 *
 * Given a model hierarchy like the above, a view hierarchy is constructed as
 * follows. The current module defines two views, HierarchyView and
 * HierarchyCollectionView. Each outer model is represented by the former while
 * each collection is represented by the latter. Each inner model is
 * represented by a view selected by the user; we call these terminal views,
 * although they may represent both internal subjects and leaf subjects of the
 * hierarchy. The user passes a `makeItem` function that will be responsible
 * for selecting and constructing the appropriate type of terminal view, given
 * an inner model.
 *
 * Rather than constructing HierarchyView or HierarchyCollectionView
 * directly, the user passes the model hierarchy, the `makeItem` function and
 * possibly other options to the `viewHierarchy` function, which is the default
 * export of the module. It takes care of some administration and it returns
 * either a HierarchyView or a HierarchyCollectionView, depending on whether
 * the top of the model hierarchy is an outer model or a collection. The
 * options include several hooks that enable the user to customize the
 * appearance and behavior of the view hierarchy without having to subclass the
 * views defined in this module, although it is still possible to do so. Please
 * continue reading below for further details.
 */

import { extend, pick, each } from 'lodash';
import {
    Collection as BCollection,
    View as BView,
} from 'backbone';

import Model from '../core/model';
import Collection from '../core/collection';
import View, {
    CompositeView,
    CollectionView,
    callActivate,
    ViewOptions as BViewOptions,
} from '../core/view';

/**
 * The types of options that can be passed to `HierarchyView`,
 * `HierarchyCollectionView` and `viewHierarchy`.
 */
export interface ViewOptions<
    // The inner model type.
    M extends Model = Model,
    // The terminal view type.
    SV extends BView<M> = View<M>
> extends BViewOptions<M> {
    // Function that constructs a terminal view given an inner model. Bound to
    // the `HierarchyView` that will contain the terminal, so it is possible to
    // for example add custom event bindings through the `this` reference.
    // Required!
    makeItem: CollectionView<M, SV>['makeItem'];
    // Options that will be passed to all views in the hierarchy that represent
    // an outer model. This can be used to customize the appearance and behavior
    // of those views. Like contenders include `tagName`, `className` and
    // `events`.
    compositeOptions?: BViewOptions<M>;
    // Likewise, but for all views that represent collections in the hierarchy.
    collectionOptions?: BViewOptions<M>;
    // Which view class should represent the collections in the hierarchy. It's
    // here to support scenarios in which `HierarchyCollectionView` is being
    // subclassed; you don't need to pass this option when calling
    // `viewHierarchy`.
    recursive?: typeof CollectionView;
}

// Options are passed down the hierarchy. To prevent a model or collection from
// a higher level from lingering around, we reset those options using the mask
// below before recursing into the next outer model.
const maskModel = { model: null, collection: null };

/**
 * View class that represents outer models. Not meant to instantiate directly,
 * but in special cases, you might need to subclass it.
 */
export class HierarchyView<
    M extends Model = Model,
    SV extends BView<M> = View<M>
> extends CompositeView<M> {
    options: ViewOptions<M, SV>;
    terminal: SV;
    recursive: typeof CollectionView;
    collectionView: CollectionView<M, SV>;

    constructor(options: ViewOptions<M, SV>) {
        super(extend(
            {},
            options,
            maskModel,
            options.compositeOptions,
            options.model.attributes,
            { options },
        ));
    }

    preinitialize({ options, recursive }: any): void {
        this.options = options;
        this.recursive = recursive;
    }

    initialize(): void {
        if (this.collection) {
            this.collectionView = new this.recursive(extend(
                {},
                this.options,
                maskModel,
                { collection: this.collection },
            ));
        }
        if (this.model) {
            this.terminal = this.options.makeItem.call(this, this.model);
        }
        this.render();
    }

    activate(): this {
        return this.forEachSubview(callActivate);
    }
}

extend(HierarchyView.prototype, {
    // Tip! You don't necessarily need to subclass HierarchyView in order to
    // just reverse the order of the subviews. You can also change the order of
    // appearance using the `flex-direction` CSS property. That, or overwrite
    // the property on `this` inside the `makeItem` function and then call
    // `this.render()` or just `this.placeSubviews()`.
    subviews: ['terminal', 'collectionView'],
});

/**
 * View class that represents collections in the hierarchy. Not meant to
 * instantiate directly, but in special cases, you might need to subclass it.
 */
export class HierarchyCollectionView<
    M extends Model = Model,
    SV extends BView<M> = View<M>
> extends CollectionView<M, HierarchyView<M, SV>> {
    options: ViewOptions<M, SV>;

    constructor(options: ViewOptions<M, SV>) {
        super(extend(
            {},
            options,
            options.collectionOptions,
            { options },
        ));
    }

    preinitialize({ options }: any): void {
        this.options = options;
    }

    initialize(): void {
        this.initItems().render().initCollectionEvents();
    }

    activate(): this {
        each(this.items, callActivate);
        return this;
    }

    makeItem(model: M) {
        return new this.subview(extend(
            {},
            this.options,
            { model, recursive: this.constructor },
        ));
    }
}

extend(HierarchyCollectionView.prototype, {
    subview: HierarchyView,
});

const recurseOption = { recursive: HierarchyCollectionView };

/**
 * Given options, including at least the `makeItem` function and either an
 * outer model or a collection, return a fully rendered view hierarchy.
 */
export default function viewHierarchy<
    M extends Model = Model,
    SV extends BView<M> = View<M>
>(options: ViewOptions<M, SV>) {
    if (options.model) {
        return new HierarchyView<M, SV>(extend(options, recurseOption));
    } else {
        return new HierarchyCollectionView<M, SV>(options);
    }
}
