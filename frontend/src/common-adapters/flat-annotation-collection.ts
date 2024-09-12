import { includes, extend } from 'lodash';

import { oa } from '../common-rdf/ns';
import Subject from '../common-rdf/subject';
import Graph from '../common-rdf/graph';
import FlatItem from './flat-item-model';
import FlatItemCollection from './flat-item-collection';

/**
 * Specialization of FlatItemCollection that represents exclusively
 * `oa.Annotation`s from an underlying `Graph` as FlatItem models. If the type
 * of an underlying Subject is not know synchronously, addition to the
 * FlatAnnotationCollection is postponed until it is confirmed to be an
 * annotation.
 *
 * The flat annotations are ordered first by the `startPosition` attribute and
 * then by the `endPosition` attribute.
 */
export default class FlatAnnotationCollection extends FlatItemCollection {
    // Current tally of tracked `Subject`s that may or may not be annotations.
    _tracking: number;

    // Override from base class to take `this._tracking` into account.
    _checkCompletion(): void {
        if (this._complete === this.length && !this._tracking) {
            this.trigger('complete:all', this, this._complete);
        }
    }

    preinitialize(): void {
        this._tracking = 0;
    }

    /**
     * Contrary to most Collection subclasses, this one requires a Graph
     * instead of an optional array of models or model attributes.
     */
    constructor(underlying: Graph, options?: any) {
        super(underlying, options);
        this.stopListening(underlying, 'sort');
        this.on('complete:all', this.sort);
    }

    /**
     * Core operation that handles incoming subjects. Override from base class.
     *
     * If `subject` is certainly an `oa.Annotation`, a corresponding
     * `FlatItem` is returned, otherwise `undefined`. The purpose of this
     * return value is that it may passed to the `add`, `set` or `reset` method.
     *
     * If the type is not yet known, `flattenPost` is installed as an event
     * handler. In this case, the return value will be established later and it
     * will always be passed to the `add` method. Pass `options` to ensure that
     * the behaviour will be the same as when you'd handle the return value
     * yourself, e.g. `{ silent: true }` if your intention is a `reset`.
     */
    flatten(subject: Subject, options?: any): FlatItem {
        const types = subject.get('@type') as string[];
        if (!types) {
            // A keen observer may notice that we use `flattenPost` as the event
            // handler below and that `flattenPost` will call `flatten` again.
            // There is no danger, however, of an endless cycle. The event
            // triggers only if the `@type` attribute changes. We come from no
            // value, so it can only change to a value, so this `if` block will
            // not be entered again.
            this.listenToOnce(
                subject,
                'change:@type',
                () => this.flattenPost(subject, options)
            );
            ++this._tracking;
        } else if (includes(types, oa.Annotation)) {
            return super.flatten(subject, options);
        }
    }

    /**
     * Post-operation for the `flatten` method above if the `@type` of the
     * `subject` is not known initially.
     *
     * The calling context of `flatten` is not available anymore, so we cannot
     * return a value to the original caller. Instead, we simply `add` the
     * result directly, since this is always the ultimate purpose of `flatten`.
     * Since `flatten` may have been called in preparation of a `set` or
     * `reset`, we make sure to pass `options` to `add` in order to replicate
     * the intended behaviour.
     */
    flattenPost(subject: Subject, options: any): void {
        --this._tracking;
        this.add(this.flatten(subject, options), options);
        this._checkCompletion();
    }

    /**
     * Listener for the `'add'` event on `this.underlying`.
     * Override from base class to take tracking into account.
     */
    proxyAdd(subject: Subject): void {
        // In case this `subject` was added before, prevent duplicate event
        // handlers.
        this.stopListening(subject, 'change:@type');
        // Add it, potentially binding the event handler again.
        super.proxyAdd(subject);
    }

    /**
     * Listener for the `'remove'` event on `this.underlying`.
     * Override from base class to take tracking into account.
     */
    proxyRemove(subject: Subject): void {
        super.proxyRemove(subject);
        // If the previous step was a no-op, we might still be listening for the
        // `'change:@type'` event on `subject` because of `flatten`. The next line
        // ensures that a flat representation of `subject` will not sneak into our
        // collection later.
        this.stopListening(subject);
    }

    /**
     * Listener for the `'reset'` event on `this.underlying`.
     * Override from base class to take tracking into account.
     */
    proxyReset(): void {
        // Prevent outstanding event listeners from pushing annotations into our
        // collection later.
        this.stopListening(null, 'change:@type');
        this._tracking = 0;
        super.proxyReset();
    }
}

extend(FlatAnnotationCollection.prototype, {
    // Sort first by `startPosition`, then by `endPosition`.
    comparator(left, right) {
        return left.get('startPosition') - right.get('startPosition') ||
               left.get('endPosition') - right.get('endPosition');
    },
});
