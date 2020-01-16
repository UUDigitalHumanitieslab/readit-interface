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
        }, this);
    }

    preinitialize(models: M[], {underlying, criterion}): void {
        extend(this, {underlying, criterion});
    }

    /**
     * Forwarding methods. You are not supposed to invoke these yourself.
     */

    proxyAdd(model: M, collection: U, options: any): void {
        if (!this.criterion(model)) return;
        this.add(model, omit(options, 'at'));
    }

    proxyRemove(model: M, collection: U, options: any): void {
        this.remove(model, options);
    }

    proxyReset(collection: U, options: any): void {
        this.reset(this.underlying.filter(this.criterion), options);
    }

    proxySort(collection: U, options: any): void {
        this.sort(options);
    }

    proxyChange(model: M, options: any): void {
        // attributes changed, so we need to re-evaluate the filter criterion.
        if (this.criterion(model)) {
            this.add(model, options);
        } else {
            this.remove(model, options);
        }
    }
}
