import { Model as BModel, Collection as BCollection }  from 'backbone';

import Model from '../core/model';
import Collection from '../core/collection';

/**
 * Class mixin with common functionality for collections that act as a proxy to
 * some underlying collection. This enables clients of such proxy classes to
 * transparently retrieve the underlying collection, even when there are
 * multiple layers of proxy collections in between. Usage:

    import mixin from '../core/mixin';
    import BaseCollection from '../anywhere';
    import ProxyMixin from '../utilities/collection-proxy';

    interface ProxyCollection extends ProxyMixin {}
    class ProxyCollection extends BaseCollection {
        constructor/initialize/preinitialize() {
            this._underlying = // the direct underlying collection
        }
    }
    mixin(ProxyCollection.prototype, ProxyMixin.prototype);

    const aProxy = new ProxyCollection(...);
    // aProxy.underlying transparently traverses any intermediate proxies
    aProxy.underlying.add(...);
 */
export default class ProxyMixin<
    M extends BModel = Model,
    C extends BCollection<M> = Collection<M>
> {
    /**
     * Classes using this mixin should use the following property internally to
     * access the direct underlying collection, which may or may not be a proxy
     * itself.
     */
    _underlying: C;

    /**
     * Clients can use the following getter to transparently retrieve the
     * innermost underlying collection, even when there are multiple layers of
     * proxies in between.
     * TypeScript cannot accurately type the return value, so we opt out of
     * type checking by returning `any` instead.
     */
    get underlying() {
        let deep: any = this._underlying;
        let deeper: any = deep['underlying'];
        while (deeper) [deep, deeper] = [deeper, deeper['underlying']];
        return deep;
    }
};
