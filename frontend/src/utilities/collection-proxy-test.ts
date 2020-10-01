import mixin from '../core/mixin';
import Model from '../core/model';
import Collection from '../core/collection';
import ProxyMixin from './collection-proxy';

interface IntermediateA extends ProxyMixin<Model, Collection> {}
class IntermediateA extends Collection {
    constructor(underlying: Collection) {
        super();
        this._underlying = underlying;
    }
}
mixin(IntermediateA.prototype, ProxyMixin.prototype);

interface IntermediateB<C extends Collection> extends ProxyMixin<Model, C> {}
class IntermediateB<C extends Collection> extends Collection {
    constructor(underlying: C) {
        super();
        this._underlying = underlying;
    }
}
mixin(IntermediateB.prototype, ProxyMixin.prototype);

describe('CollectionProxyMixin', function() {
    it('unwraps multiple levels of collection proxies when applicable', function() {
        const bottom = new Collection();
        const middle = new IntermediateA(bottom);
        const top = new IntermediateB<IntermediateA>(middle);
        expect(middle._underlying).toBe(bottom);
        expect(middle.underlying).toBe(bottom);
        expect(top._underlying).toBe(middle);
        expect(top.underlying).toBe(bottom);
    });
});
