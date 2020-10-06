import mixin from './mixin';

class Base {
    foo: string
    constructor(arg: string) {
        this.foo = arg;
    }
    bar() {
        return 'bar';
    }
    get baz(): string {
        return this.foo;
    }
    set baz(arg: string) {
        this.foo = arg;
    }
}

class Mixin {
    foofoo: string
    foobar() {
        return 'foobar';
    }
    get foobaz(): string {
        return this.foofoo;
    }
    set foobaz(arg: string) {
        this.foofoo = arg;
    }
}

interface Derived extends Mixin {
    foobarbaz: string;
}
class Derived extends Base {
    constructor(arg: string) {
        super(arg);
        this.foofoo = arg;
    }
}
mixin(Derived.prototype, Mixin.prototype, { foobarbaz: 'foobarbaz' });

describe('mixin', function() {
    beforeEach(function() {
        this.obj = new Derived('beans');
    });

    it('respects class inheritance', function() {
        expect(this.obj.foo).toBe('beans');
        expect(this.obj.bar()).toBe('bar');
        expect(this.obj.baz).toBe('beans');
        this.obj.baz = 'lentils';
        expect(this.obj.foo).toBe('lentils');
        expect(this.obj.baz).toBe('lentils');
    });

    it('does not overwrite the constructor', function() {
        expect(Mixin.prototype.constructor).toBe(Mixin);
        expect(Derived.prototype.constructor).toBe(Derived);
        expect(Derived as object).not.toBe(Mixin as object);
        expect(this.obj.foofoo).toBe('beans');
    });

    it('works', function() {
        expect(this.obj.foobar()).toBe('foobar');
        expect(this.obj.foobaz).toBe('beans');
        this.obj.foobaz = 'lentils';
        expect(this.obj.foofoo).toBe('lentils');
        expect(this.obj.foobaz).toBe('lentils');
        expect(this.obj.foobarbaz).toBe('foobarbaz');
    });
});
