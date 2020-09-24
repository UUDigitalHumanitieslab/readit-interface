import { after, noop } from 'lodash';

import Model from './model';

function callbackChecker(model, value, options, context, done) {
    return jasmine.createSpy().and.callFake(function(m, v, o) {
        expect(m).toBe(model);
        expect(value).toContain(v);
        expect(o).toEqual(options);
        expect(this).toBe(context);
        done();
    });
}

describe('Model', function() {
    describe('when', function() {
        it('invokes the callback if the attribute is present', function(done) {
            const model = new Model({ a: 1 });
            const spy = callbackChecker(model, [1], {}, model, done);
            model.when('a', spy);
            expect(spy).not.toHaveBeenCalled();
        });

        it('invokes the callback when the attribute is first set otherwise', function(done) {
            const model = new Model();
            const spy = callbackChecker(model, [1], {}, model, done);
            model.when('a', spy);
            expect(spy).not.toHaveBeenCalled();
            model.set('a', 1);
        });

        it('respects the context', function(done) {
            const cb = after(2, done);
            const model = new Model({ a: 1 });
            const listener = new Model;
            const options = { silent: false };
            const spy1 = callbackChecker(model, [1], {}, listener, cb);
            const spy2 = callbackChecker(model, [2], options, listener, cb);
            model.when('a', spy1, listener);
            model.when('b', spy2, listener);
            model.set('b', 2, options);
        });

        it('accepts valid callbacks', function() {
            const model = new Model;
            model.when('a', (m: Model) => null);
            model.when('b', (m: Model, v: string) => null);
            model.when('c', (m: Model, v: number, o: object) => null);
            model.off();
        });
    });

    describe('whenever', function() {
        it('invokes the callback if the attribute is present', function() {
            const model = new Model({ a: 1 });
            const spy = callbackChecker(model, [1, 2], {}, model, noop);
            model.whenever('a', spy);
            expect(spy).toHaveBeenCalled();
            model.set('a', 2);
            expect(spy).toHaveBeenCalledTimes(2);
            model.off();
        });

        it('invokes the callback whenever the attribute is set otherwise', function() {
            const model = new Model();
            const spy = callbackChecker(model, [1, 2], {}, model, noop);
            model.whenever('a', spy);
            expect(spy).not.toHaveBeenCalled();
            model.set('a', 1);
            model.set('a', 2);
            expect(spy).toHaveBeenCalledTimes(2);
            model.off();
        });

        it('respects the context', function() {
            const model = new Model({ a: 1 });
            const listener = new Model;
            const options = { silent: false };
            const spy1 = callbackChecker(model, [1], {}, listener, noop);
            const spy2 = callbackChecker(model, [2], options, listener, noop);
            model.whenever('a', spy1, listener);
            model.whenever('b', spy2, listener);
            expect(spy1).toHaveBeenCalled();
            expect(spy2).not.toHaveBeenCalled();
            model.set('b', 2, options);
            expect(spy2).toHaveBeenCalled();
            listener.stopListening();
        });

        it('accepts valid callbacks', function() {
            const model = new Model;
            model.whenever('a', (m: Model) => null);
            model.whenever('b', (m: Model, v: string) => null);
            model.whenever('c', (m: Model, v: number, o: object) => null);
            model.off();
        });
    });
});
