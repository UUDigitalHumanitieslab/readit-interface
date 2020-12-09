import {
    extend,
    defaultsDeep,
    omit,
    iteratee,
    isFunction,
    ListIterator,
} from 'lodash';
import {
    Model as BModel,
    Collection as BCollection,
} from 'backbone';

import mixin from '../core/mixin';
import Model from '../core/model';
import Collection from '../core/collection';
import ProxyMixin from './collection-proxy';

type AnyFunction = (...args: any[]) => any;
// surprising inconsistency in @types/lodash
type IterateeParam = string | object | AnyFunction;

export
type FilterCriterion<M extends BModel> = ListIterator<M, boolean>;

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
interface FilteredCollection<
    M extends BModel = Model,
    U extends BCollection<M> = Collection<M>
> extends ProxyMixin<M, U> {}
class FilteredCollection<
    M extends BModel = Model,
    U extends BCollection<M> = Collection<M>
> extends Collection<M> {
    criterion: FilterCriterion<M>;
    matches: AnyFunction;

    constructor(underlying: U, criterionArg: IterateeParam, options?: any) {
        const criterion = criterionArg as FilterCriterion<M>;
        const comparator = underlying.comparator;
        options = defaultsDeep(options || {}, {
            underlying,
            criterion,
            model: underlying.model,
        }, comparator && { comparator } || {});
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
        let matches: AnyFunction;
        if (isFunction(criterion)) {
            matches = criterion;
        } else {
            const wrappedIterator = iteratee(criterion as IterateeParam);
            matches = model => wrappedIterator(model.attributes);
        }
        extend(this, {_underlying: underlying, criterion, matches});
    }

    /**
     * Forwarding methods. You are not supposed to invoke these yourself.
     */

    proxyAdd(model: M, collection: U, options: any): void {
        if (this.matches(model)) this.add(model, omit(options, 'at'));
    }

    proxyRemove(model: M, collection: U, options: any): void {
        this.remove(model, options);
    }

    proxyReset(collection: U, options: any): void {
        this.reset(this._underlying.filter(this.criterion), options);
    }

    proxySort(collection: U, options: any): void {
        if (this.comparator) this.sort(options);
    }

    proxyChange(model: M, options: any): void {
        // attributes changed, so we need to re-evaluate the filter criterion.
        if (this.matches(model)) {
            this.add(model, options);
        } else {
            this.remove(model, options);
        }
    }
}
mixin(FilteredCollection.prototype, ProxyMixin.prototype);

export default FilteredCollection;
