import {
    extend,
    defaultsDeep,
    omit,
    iteratee,
    ListIterateeCustom,
} from 'lodash';
import {
    Model as BModel,
    Collection as BCollection,
} from 'backbone';

import Model from '../core/model';
import Collection from '../core/collection';

type AnyFunction = (...args: any[]) => any;
// surprising inconsistency in @types/lodash
type IterateeParam = string | object | AnyFunction;

export
type FilterCriterion<M extends BModel> = ListIterateeCustom<M, boolean>;

/**
 * Helper function for the disabled methods in FilteredCollection.
 */
function refuseModifications(method): never {
    throw TypeError(`FilteredCollection is read-only. Invoke ${method} on the underlying collection instead.`)
}

/**
 * Synchronized filtered read-only proxy to a Backbone.Collection.
 *
 * Use this to keep a filtered subset of some other, pre-existing
 * collection (the underlying collection). The filtered proxy stays
 * in sync with the underlying collection and will emit the same
 * events when the filtered subset is affected. Do not fetch or
 * modify the proxy directly; such operations should be performed on
 * the underlying collection instead.
 *
 * Example of usage:

    let myFilteredProxy = new FilteredCollection(theRawCollection, model => {
        return model.has('@id');
    });
    myFilteredProxy.forEach(...);
    myFilteredProxy.on('add', ...);

 */
export default class FilteredCollection<
    M extends BModel = Model,
    U extends BCollection<M> = Collection<M>
> extends Collection<M> {
    underlying: U;
    criterion: AnyFunction;

    constructor(underlying: U, criterion: FilterCriterion<M>, options?: any) {
        criterion = iteratee(criterion as IterateeParam);
        options = defaultsDeep(options || {}, {
            underlying,
            criterion,
            comparator: underlying.comparator,
        });
        const initialModels = underlying.filter(criterion);
        super(initialModels, options);
        underlying.on({
            add: this.proxyAdd,
            remove: this.proxyRemove,
            reset: this.proxyReset,
            sort: this.proxySort,
            change: this.proxyChange,
            all: this.forwardUnderlyingEvent,
        }, this);
    }

    preinitialize(models: M[], {underlying, criterion}): void {
        extend(this, {underlying, criterion});
    }

    /**
     * Forwarding methods. You are not supposed to invoke these yourself.
     *
     * These methods invoke super methods because the corresponding
     * methods on this have been overridden.
     */

    proxyAdd(model: M, collection: U, options: any): void {
        if (!this.criterion(model)) return;
        super.add(model, omit(options, 'at'));
    }

    proxyRemove(model: M, collection: U, options: any): void {
        super.remove(model, options);
    }

    proxyReset(collection: U, options: any): void {
        super.reset(this.underlying.filter(this.criterion), options);
    }

    proxySort(collection: U, options: any): void {
        super.sort(options);
    }

    proxyChange(model: M, options: any): void {
        // attributes changed, so we need to re-evaluate the filter criterion.
        const metCriterion = this.includes(model);
        const meetsCriterion = this.criterion(model);
        if (!meetsCriterion) return super.remove(model, options), null;
        if (!metCriterion) return super.add(model, options), null;
        this.trigger('change', model, options);
    }

    forwardUnderlyingEvent(eventName: string, ...args: any[]): void {
        let model, rest, collection, options;

        switch (eventName) {
        // events already forwarded by the above proxy methods
        case 'add': case 'remove': case 'reset': case 'sort': case 'change':
            break;
        // events we simply ignore (xhr-related)
        case 'destroy': case 'request': case 'sync': case 'error':
            break;
        // update
        case 'update':
            [collection, options] = args;
            const filteredChanges = {
                added: options.changes.added.filter(this.criterion),
                removed: options.changes.removed.filter(this.criterion),
                merged: options.changes.merged.filter(this.criterion),
            };
            if (filteredChanges.added.length || filteredChanges.removed.length || filteredChanges.merged.length) {
                this.trigger(eventName, this, defaultsDeep({
                    changes: filteredChanges,
                }, options));
            }
            break;
        // change:[attribute] and invalid
        default:
            [model, ...rest] = args;
            if (this.criterion(model)) {
                this.trigger(eventName, model, ...rest);
            }
        }
    }

    /**
     * Disabled methods that should be invoked on the underlying
     * collection instead.
     */
    sync()    { return refuseModifications('sync'); }
    add()     { return refuseModifications('add'); }
    remove()  { return refuseModifications('remove'); }
    reset()   { return refuseModifications('reset'); }
    set()     { return refuseModifications('set'); }
    push()    { return refuseModifications('push'); }
    pop()     { return refuseModifications('pop'); }
    unshift() { return refuseModifications('unshift'); }
    shift()   { return refuseModifications('shift'); }
    sort()    { return refuseModifications('sort'); }
    fetch()   { return refuseModifications('fetch'); }
    create()  { return refuseModifications('create'); }
}
