import { map, invert, compact, throttle } from 'lodash';

import mixin from '../core/mixin';
import Collection from '../core/collection';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';
import ProxyMixin from './collection-proxy';
import FlatItem from './flat-item-model';

/**
 * Adapter that represents Nodes from an underlying `Graph` as FlatItem models.
 *
 * `'complete'` events triggered by models are forwarded by the collection, as
 * with all model events. In addition, a single `'complete:all'` event is
 * triggered when a state is reached in which all items known to the collection
 * are complete.
 *
 * The collection stays in sync with the underlying `Graph`. This should be
 * considered read-only; manipulate the underlying `Graph` in order to change
 * the contents of the flat representation.
 *
 * At any one time, at most one flat item in the collection may be "in focus".
 * At the model layer, this is an abstract notion; views may use the
 * information in order to emphasize the presentation of the focused item over
 * other items. Focus can be shifted by triggering a `'focus'` event on any
 * individual flat item and removed by triggering `'blur'` on the item that is
 * currently in focus. The collection propagates these events and ensures that
 * the previous focused item blurs automatically when a different item receives
 * focus.
 */
interface FlatItemCollection extends ProxyMixin<Node, Graph> {}
class FlatItemCollection extends Collection<FlatItem> {
    // Current tally of complete flat items.
    _complete: number;

    // Some event handlers that update `_complete`. Note that `_tracking` is
    // updated in `flatten` and `flattenPost`.
    _addComplete() { ++this._complete; this._checkCompletion(); }
    _removeComplete(item) {
        item.complete && --this._complete || this._checkCompletion();
    }

    // Trigger the `'complete:all'` event if appropriate.
    _checkCompletion(): void {
        if (this._complete === this.length) {
            this.trigger('complete:all', this, this._complete);
        }
    }

    // The item that is currently in focus, if any.
    focus: FlatItem;

    // Handlers for `'focus'` and `'blur'` events to maintain the invariant that
    // only one item can be in focus at the same time.
    _onFocus(newFocus: FlatItem): void {
        const oldFocus = this.focus;
        if (oldFocus && oldFocus !== newFocus) {
            oldFocus.trigger('blur', oldFocus, newFocus);
        }
        this.focus = newFocus;
    }
    _onBlur(item: FlatItem): void {
        if (item === this.focus) delete this.focus;
    }

    /**
     * Contrary to most Collection subclasses, this one requires a Graph
     * instead of an optional array of models or model attributes.
     */
    constructor(underlying: Graph, options?: any) {
        super(null, options);
        this._underlying = underlying;
        this._complete = 0;
        this.listenTo(underlying, {
            add: this.proxyAdd,
            remove: this.proxyRemove,
            sort: this.proxySort,
            reset: this.proxyReset,
        });
        this.on({
            complete: this._addComplete,
            remove: this._removeComplete,
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
        // `sort` is going to be called on every `add` and takes linear time.
        // The next line ensures it runs at most once in every 200ms.
        this.sort = throttle(this.sort, 200);
    }

    /**
     * Core operation that handles incoming nodes. Can be overridden for more
     * specific behavior.
     */
    flatten(node: Node, options?: any): FlatItem {
        return new FlatItem(node);
    }

    /**
     * Variant of `flatten` that can be used to prepare a `reset`. Useful as an
     * iteratee for `map`.
     */
    flattenSilent(node: Node): FlatItem {
        return this.flatten(node, { silent: true });
    }

    /**
     * Listener for the `'add'` event on `this._underlying`.
     */
    proxyAdd(node: Node, graph?: Graph, options?: any): void {
        this.add(this.flatten(node), options);
    }

    /**
     * Listener for the `'remove'` event on `this._underlying`.
     */
    proxyRemove(node: Node): void {
        // Find any flat representation of `node` and remove it. This might be a
        // no-op.
        const flat = this.get(node.id);
        if (flat) {
            // A removed item cannot be in focus, so blur it first.
            flat.trigger('blur', flat);
            this.remove(flat);
        }
    }

    /**
     * Listener for the `'sort'` event on `this._underlying`.
     */
    proxySort(underlying: Graph): void {
        const order = invert(map(underlying.models, 'id'));
        this.comparator = flat => order[flat.id];
        this.sort();
        delete this.comparator;
    }

    /**
     * Listener for the `'reset'` event on `this._underlying`.
     */
    proxyReset(): void {
        this._complete = 0;
        delete this.focus;
        // Reset with the known items and silently add the unknown
        // items later.
        const flattenSilent = this.flattenSilent.bind(this);
        this.reset(compact(this._underlying.map(flattenSilent)));
    }
}
mixin(FlatItemCollection.prototype, ProxyMixin.prototype, {
    model: FlatItem,
});

export default FlatItemCollection;
