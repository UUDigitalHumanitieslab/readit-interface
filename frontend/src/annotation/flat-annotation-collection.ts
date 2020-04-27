import { compact, includes, extend, throttle } from 'lodash';

import Collection from '../core/collection';
import { oa } from '../jsonld/ns';
import Node from '../jsonld/node';
import Graph from '../jsonld/graph';
import FlatAnnotation from './flat-annotation-model';

/**
 * Adapter that represents `oa.Annotation`s from an underlying `Graph` as
 * FlatAnnotation models.
 *
 * `'complete'` events triggered by models are forwarded by the collection, as
 * with all model events. In addition, a single `'complete:all'` event is
 * triggered when a state is reached in which all annotations known to the
 * collection are complete.
 *
 * The collection stays in sync with the underlying `Graph`. This should be
 * considered read-only; manipulate the underlying `Graph` in order to change
 * the contents of the flat representation.
 *
 * The flat annotations are ordered first by the `startPosition` attribute and
 * then by the `endPosition` attribute.
 *
 * At any one time, at most one flat annotation in the collection may be "in
 * focus". At the model layer, this is an abstract notion; views may use the
 * information in order to emphasize the presentation of the focused annotation
 * over other annotations. Focus can be shifted by triggering a `'focus'` event
 * on any individual flat annotation and removed by triggering `'blur'` on the
 * annotation that is currently in focus. The collection propagates these
 * events and ensures that the previous focused annotation blurs automatically
 * when a different annotation receives focus.
 */
export default class FlatAnnotationCollection extends Collection<FlatAnnotation> {
    // We keep hold of the underlying `Graph`, mostly as a service to the user.
    underlying: Graph;

    // Current tally of complete flat annotations.
    _complete: number;

    // Current tally of tracked `Node`s that may or may not be annotations.
    _tracking: number;

    // Some event handlers that update `_complete`. Note that `_tracking` is
    // updated in `flatten` and `flattenPost`.
    _addComplete() { ++this._complete; this._checkCompletion(); }
    _removeComplete() { --this._complete; }

    // Trigger the `'complete:all'` event if appropriate.
    _checkCompletion(): void {
        if (this._complete === this.length && !this._tracking) {
            this.trigger('complete:all', this, this._complete);
        }
    }

    // The annotation that is currently in focus, if any.
    focus: FlatAnnotation;

    // Handlers for `'focus'` and `'blur'` events to maintain the invariant that
    // only one annotation can be in focus at the same time.
    _onFocus(newFocus: FlatAnnotation): void {
        const oldFocus = this.focus;
        if (oldFocus && oldFocus !== newFocus) {
            oldFocus.trigger('blur', oldFocus);
        }
        this.focus = newFocus;
    }
    _onBlur(annotation: FlatAnnotation): void {
        if (annotation === this.focus) delete this.focus;
    }

    /**
     * Contrary to most Collection subclasses, this one requires a Graph
     * instead of an optional array of models or model attributes.
     */
    constructor(underlying: Graph, options?: any) {
        super(null, options);
        this.underlying = underlying;
        this._complete = this._tracking = 0;
        this.listenTo(underlying, {
            add: this.proxyAdd,
            remove: this.proxyRemove,
            reset: this.proxyReset,
        });
        this.on({
            complete: this._addComplete,
            remove: this._removeComplete,
            'complete:all': this.sort,
            focus: this._onFocus,
            blur: this._onBlur,
        });
        // Set the initial models. This would otherwise be done by `super`, but
        // we passed `null`.
        this.reset(
            // We passed `null` because we would otherwise pass the following
            // expression, but we cannot do that because `this` is not available
            // until `super` has been called.
            compact(underlying.map(this.flattenSilent.bind(this))),
            // The initial reset is always silent.
            { silent: true }
        );
    }

    /**
     * Core operation that handles incoming nodes.
     *
     * If `node` is certainly an `oa.Annotation`, a corresponding
     * `FlatAnnotation` is returned, otherwise `undefined`. The purpose of this
     * return value is that it may passed to the `add`, `set` or `reset` method.
     *
     * If the type is not yet known, `flattenPost` is installed as an event
     * handler. In this case, the return value will be established later and it
     * will always be passed to the `add` method. Pass `options` to ensure that
     * the behaviour will be the same as when you'd handle the return value
     * yourself, e.g. `{ silent: true }` if your intention is a `reset`.
     */
    flatten(node: Node, options?: any): FlatAnnotation {
        const types = node.get('@type') as string[];
        if (!types) {
            // A keen observer may notice that we use `flattenPost` as the event
            // handler below and that `flattenPost` will call `flatten` again.
            // There is no danger, however, of an endless cycle. The event
            // triggers only if the `@type` attribute changes. We come from no
            // value, so it can only change to a value, so this `if` block will
            // not be entered again.
            this.listenToOnce(
                node,
                'change:@type',
                () => this.flattenPost(node, options)
            );
            ++this._tracking;
        } else if (includes(types, oa.Annotation)) {
            return new FlatAnnotation(node);
        }
    }

    /**
     * Post-operation for the `flatten` method above if the `@type` of the
     * `node` is not known initially.
     *
     * The calling context of `flatten` is not available anymore, so we cannot
     * return a value to the original caller. Instead, we simply `add` the
     * result directly, since this is always the ultimate purpose of `flatten`.
     * Since `flatten` may have been called in preparation of a `set` or
     * `reset`, we make sure to pass `options` to `add` in order to replicate
     * the intended behaviour.
     */
    flattenPost(node: Node, options: any): void {
        --this._tracking;
        this.add(this.flatten(node, options), options);
        this._checkCompletion();
    }

    /**
     * Variant of `flatten` that can be used to prepare a `reset`. Useful as an
     * iteratee for `map`.
     */
    flattenSilent(node: Node): FlatAnnotation {
        return this.flatten(node, { silent: true });
    }

    /**
     * Listener for the `'add'` event on `this.underlying`.
     */
    proxyAdd(node: Node): void {
        // In case this `node` was added before, prevent duplicate event
        // handlers.
        this.stopListening(node, 'change:@type');
        // Add it, potentially binding the event handler again.
        this.add(this.flatten(node));
    }

    /**
     * Listener for the `'remove'` event on `this.underlying`.
     */
    proxyRemove(node: Node): void {
        // Find any flat representation of `node` and remove it. This might be a
        // no-op.
        this.remove(node.id);
        // If the previous step was a no-op, we might still be listening for the
        // `'change:@type'` event on `node` because of `flatten`. The next line
        // ensures that a flat representation of `node` will not sneak into our
        // collection later.
        this.stopListening(node);
    }

    /**
     * Listener for the `'reset'` event on `this.underlying`.
     */
    proxyReset(): void {
        // Prevent outstanding event listeners from pushing annotations into our
        // collection later.
        this.stopListening(null, 'change:@type');
        // Reset our tallies.
        this._complete = this._tracking = 0;
        // Reset focus.
        delete this.focus;
        // Reset with the known annotations and silently add the unknown
        // annotations later.
        this.reset(compact(this.underlying.map(this.flattenSilent.bind(this))));
    }
}

extend(FlatAnnotationCollection.prototype, {
    model: FlatAnnotation,
    // Sort first by `startPosition`, then by `endPosition`.
    comparator(left, right) {
        return left.get('startPosition') - right.get('startPosition') ||
               left.get('endPosition') - right.get('endPosition');
    },
    // `sort` is going to be called on every `add` and takes linear time. The
    // next line ensures it runs at most once in every 200ms.
    sort: throttle(FlatAnnotationCollection.prototype.sort, 200),
});
