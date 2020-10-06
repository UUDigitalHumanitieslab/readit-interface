import { Model as BackboneModel } from 'backbone';
import { extend, isFunction } from 'lodash';

import { syncWithCSRF } from './csrf';
import fastTimeout from './fastTimeout';

/**
 * Name for the type of function that handles a `change:$attribute` event.
 */
interface ValueProcessor {
    (model: Model, value: any, options: any): void;
}

/**
 * This is the base model class that all models in the application
 * should derive from, either directly or indirectly. If you want to
 * apply a customization to all models in the application, do it here.
 */
export default class Model extends BackboneModel {
    /**
     * Pattern for processing an `attribute` that may still be missing at the
     * time of invocation. This is determined by testing whether `attribute` is
     * present on `this`. `handler` is bound to `context` if passed, otherwise
     * to `this`. `handler` is always invoked async, with the same arguments
     * that the `change:$attribute` event would pass.
     */
    when(attribute: string, handler: ValueProcessor, context?: any): void {
        const eventName = `change:${attribute}`;
        if (this.has(attribute)) {
            const value = this.get(attribute);
            fastTimeout(handler.bind(context || this), this, value, {});
        } else if (context && isFunction(context.listenToOnce)) {
            context.listenToOnce(this, eventName, handler);
        } else {
            this.once(eventName, handler, context);
        }
    }

    /**
     * Like `when`, with two main differences:
     * 1. If the `attribute` is already present at the time of invocation, the
     *    `handler` is invoked immediately instead of async.
     * 2. The `handler` will be continue to be invoked on every subsequent
     *    change of the `attribute`, instead of being called exactly once.
     */
    whenever(attribute: string, handler: ValueProcessor, context?: any): void {
        if (this.has(attribute)) {
            handler.call(context || this, this, this.get(attribute), {});
        }
        const eventName = `change:${attribute}`;
        if (context && isFunction(context.listenTo)) {
            context.listenTo(this, eventName, handler);
        } else {
            this.on(eventName, handler, context);
        }
    }
}

extend(Model.prototype, {
    sync: syncWithCSRF,
    url: function() {
        // Django requires the trailing slash, so add it.
        return BackboneModel.prototype.url.apply(this) + '/';
    },
});

// Example: suppose we want to type-check the attributes of every
// model. We could do something like the following.
//
// Note: we should NOT do this if we want to go real ReST!

// export default class TypedModel<Content extends {}> extends BackboneModel {
//     attributes: Content;
// }
