import {
    each,
    sampleSize,
    shuffle,
    random,
    times,
    range,
    map,
    mapValues,
    clone,
    extend,
    identity ,
    propertyOf,
    partial,
    isObject,
    isArray,
    isNumber,
} from 'lodash';
import * as _ from 'lodash';
import { Model as BModel } from 'backbone';

import Model from '../core/model';
import Collection from '../core/collection';

import abstractDeepEqual from './abstractDeepEqual';

const primitives: any[] = [
    null, undefined, NaN,
    true, false,
    0, 1, 2,
    '', '0', '1', 'abc',
];
if (typeof Symbol === 'function') primitives.push(Symbol(), Symbol());

const hashes = [
    {},
    { a: 1 },
    { a: 1, b: undefined },
    { a: 1, b: 2 },
    { a: '1' },
];

const arrays = [
    [],
    [undefined],
    [0],
    [0, 1],
    [0, '1'],
    [0, , 1],
];

const hashArrays = map([
    [],
    [0], [1], [2], [3], [4],
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
    [0, 0, 0, 0, 0],
    [0, 1, 2, 3, 4],
    [2, 2, 2, 2, 2],
    [4, 4, 4, 4, 4],
], indices => map(indices, index => clone(hashes[index])));

function TrivialClass(hash) { extend(this, hash); }

function toTrivial(hash) { return new TrivialClass(hash); }
function toBModel(hash) { return new BModel(hash); }
function toModel(hash) { return new Model(hash); }

function echoArguments() { return arguments; }

function toArguments(array) { return echoArguments.apply(null, array); }
function toCollection(array) { return new Collection(array); }

const hashWrappers = [clone, toTrivial, toBModel, toModel];
const arrayWrappers = [identity, toArguments, toCollection];

// Function factory. The parameters determine which types of wrappers may occur
// in the output of the generated function (see description two lines down).
function mixedWrap(hashWrappers, arrayWrappers) {
    /**
     * Given an arbitrary, nested datastructure of plain objects, plain arrays
     * and primitive values, return a similar structure in which some or all of
     * the arrays and objects are replaced by a Model, Arguments, Collection,
     * etcetera with equal contents (depending on what transforms are included
     * in the hashWrappers and arrayWrappers metaparameters).
     *
     * The wrapping algorithm is deterministic; given the same arguments, it
     * will always return the same output. Also, if two datastructures differ
     * only in their primitive values, their outputs will include the same
     * wrappers in the same places. This can be used to generate two or more
     * datastructures with the same arbitrary assignment of wrappers.
     *
     * The wrappers are applied cyclically. The optional second argument
     * determines where to start in the cycle. When `wrap` is passed as an
     * array iteratee to a function like _.map, this will produce a *different*
     * assignment of wrappers in each successive application.
     *
     * Backbone.Collection, when receiving an array as first constructor
     * argument, will attempt to coerce each element of the array to Model. One
     * may sometimes want to avoid this. For this reason, if the first element
     * of an array is a primitive, the algorithm will skip the `toCollection`
     * wrapper. Conversely, if the first element is an object, it is strongly
     * recommended to put only plain objects in that array.
     */
    return function wrap(value: any, state?: number | { count: number }): any {
        if (!isObject(value)) return value;
        state = state || 0;
        if (isNumber(state)) state = { count: state };
        const wrapIteratee = partial(wrap, _, state);
        let data: any, wrappers: typeof hashWrappers | typeof arrayWrappers;
        if (isArray(value)) {
            data = map(value, wrapIteratee);
            wrappers = arrayWrappers;
            if (
                value.length &&
                wrappers[state.count] === toCollection &&
                !isObject(value[0])
            ) ++state.count;
        } else {
            data = mapValues(value, wrapIteratee);
            wrappers = hashWrappers;
        }
        return wrappers[state.count++ % wrappers.length](data);
    };
}

describe('abstractDeepEqual', function() {
    it('compares primitive values by identity', function() {
        each(primitives, (value) => {
            expect(abstractDeepEqual(value, value)).toBe(true);
        });
        // Randomly check that a pair of distinct primitive values compares
        // unequal, 50 times. This module contains a lot of fuzz testing like
        // this.
        times(50, () => {
            const [left, right] = sampleSize(primitives, 2);
            expect(abstractDeepEqual(left, right)).toBe(false);
        });
    });

    it('compares object wrappers and dates by underlying value', function() {
        const now = new Date();
        const nowCopy = new Date(now);
        const past = new Date(2015, 6, 6);
        const alsoPast = new Date(2015, 6, 6);
        const invalid1 = new Date('invalid');
        const invalid2 = new Date('also invalid');
        const uniqueDates = [now, past, invalid1];
        const equalDates = [nowCopy, alsoPast, invalid2];
        const objectWrappers = map(primitives, Object).concat(uniqueDates);
        each(uniqueDates, (date, index) => {
            expect(abstractDeepEqual(date, equalDates[index])).toBe(true);
        });
        each(objectWrappers, (value) => {
            expect(abstractDeepEqual(value, value)).toBe(true);
        });
        // null and undefined both produce a plain empty object when
        // Object-wrapped, so remove one to keep all values different.
        objectWrappers.shift();
        times(50, () => {
            const [i1, i2] = sampleSize(range(objectWrappers.length), 2);
            const [left, right] = map([i1, i2], propertyOf(objectWrappers));
            expect(abstractDeepEqual(left, right))
                // The .withContext text is included in the assertion failure
                // message, so it is more informative than just "expected true
                // to be false".
                .withContext(`${i1} ${i2}`)
                .toBe(false);
        });
    });

    it('compares objects and models by keys', function() {
        each(hashWrappers, (wrap) => {
            each(hashes, (hash) => {
                expect(abstractDeepEqual(wrap(hash), wrap(hash))).toBe(true);
            });
            times(10, () => {
                const [left, right] = sampleSize(hashes, 2);
                expect(abstractDeepEqual(wrap(left), wrap(right))).toBe(false);
            });
        });
    });

    it('compares arrays by indices', function() {
        const treatments = [
            identity,
            array => array.slice(),
            array => extend(array.slice(), { test: 'test' }),
        ];
        each(arrays, (array) => {
            const stretchedClone = array.slice();
            ++stretchedClone.length;
            each(treatments, (treatment) => {
                expect(abstractDeepEqual(array, array)).toBe(true);
                expect(abstractDeepEqual(array, stretchedClone)).toBe(false);
                expect(abstractDeepEqual(stretchedClone, array)).toBe(false);
                expect(abstractDeepEqual(stretchedClone, stretchedClone))
                    .toBe(true);
                if (treatment === identity) return;
                expect(abstractDeepEqual(array, treatment(array))).toBe(true);
                expect(abstractDeepEqual(treatment(array), array)).toBe(true);
                expect(abstractDeepEqual(treatment(array), treatment(array)))
                    .toBe(true);
                expect(abstractDeepEqual(
                    treatment(array), treatment(stretchedClone)
                )).toBe(false);
                expect(abstractDeepEqual(
                    treatment(stretchedClone), treatment(array)
                )).toBe(false);
                expect(abstractDeepEqual(
                    treatment(stretchedClone), treatment(stretchedClone)
                )).toBe(true);
            });
        });
        times(20, () => {
            const [left, right] = sampleSize(arrays, 2);
            const [t1, t2] = sampleSize(treatments, 2);
            expect(abstractDeepEqual(t1(left), t1(right))).toBe(false);
            expect(abstractDeepEqual(t1(left), t2(right))).toBe(false);
        });
    });

    it('treats array-like objects as arrays', function() {
        // We're going to generate 8 different objects with each a different
        // combination of the following three features: whether it has the a/b
        // properties or not, whether it has the 1/2 properties or not, and
        // whether it has a non-enumerable length property with value 2 or not.
        const props = { a: true, b: false };
        const elems = { 1: true, 2: false };
        function Lengthy(flags) {
            // `flags` is sourced from an array index below. Helpfully, the
            // numbers 0-7 each have a different combination of the three least
            // significant bits.
            if (flags & 1) Object.defineProperty(this, 'length', {
                value: 2,
                enumerable: false,
            });
            extend(this, flags & 2 ? props : null, flags & 4 ? elems : null);
        }
        const variations = times(8, index => new Lengthy(index));
        // Objects with a .length are considered array-like while objects
        // without are not. Below, we check that the a/b properties are only
        // taken into account when both sides are NOT array-like.
        each(variations, (left, index1) => {
            each(variations, (right, index2) => {
                const mask = index1 & 1 ? 5 : 7;
                const ordeal = (index1 & mask) === (index2 & mask);
                expect(abstractDeepEqual(left, right))
                    .withContext(`${index1}${index2}`)
                    .toBe(ordeal);
            });
        });
    });

    it('compares collections of hashes recursively', function() {
        each(arrayWrappers, (wrapA) => {
            each(hashWrappers, (wrapH) => {
                // We skip the collection of plain objects because it ends up
                // being coerced to the same situation as a collection of
                // models.
                if (wrapH === clone && wrapA === toCollection) return;
                const customize = array => wrapA(map(array, wrapH));
                each(hashArrays, (array) => {
                    const [left, right] = map([array, array], customize);
                    expect(abstractDeepEqual(left, right)).toBe(true);
                });
                times(10, () => {
                    const [l, r] = map(sampleSize(hashArrays, 2), customize);
                    expect(abstractDeepEqual(l, r)).toBe(false);
                });
            });
        });
    });

    it('requires equal types', function() {
        each(hashes, (hash) => {
            // Expect different types of hash-like objects with equal contents
            // to compare unequal.
            times(10, () => {
                const [w1, w2] = sampleSize(hashWrappers, 2);
                expect(abstractDeepEqual(w1(hash), w2(hash)))
                    .withContext(`${JSON.stringify(hash)} ${w1.name} ${w2.name}`)
                    .toBe(false);
            });
        });
        each(arrays, (array) => {
            // Expect different types of array-like objects with equal contents
            // to compare unequal.
            const args = toArguments(array);
            const text = map([array, args], JSON.stringify);
            expect(abstractDeepEqual(array, args))
                .withContext(`${text[0]} ${text[1]}`)
                .toBe(false);
            expect(abstractDeepEqual(args, array))
                .withContext(`${text[1]} ${text[0]}`)
                .toBe(false);
        });
        each(hashArrays, (array, index) => {
            // Expect different types of array-like collections with equal
            // objects/models inside to compare unequal.
            const shuffWrap = sampleSize(arrayWrappers, 2);
            const wrap = mixedWrap([toModel], shuffWrap);
            const [left, right] = map([array, array], wrap);
            expect(abstractDeepEqual(left, right))
                .withContext(`hashArray ${index} ${map(shuffWrap, 'name')}`)
                .toBe(false);
            if (!array.length) return;
            times(10, () => {
                // Expect equal types of array-like collections with equal
                // numbers of differently typed objects/models inside (with
                // ultimately equal contents) to compare unequal.
                const shuffWrap = shuffle(hashWrappers);
                const wrap = mixedWrap(shuffWrap, [identity]);
                const mix1 = wrap(array);
                const mix2 = wrap(array);
                const oddPosition = random(array.length);
                const oddWrap = shuffWrap[(oddPosition + 1) % shuffWrap.length];
                mix2[oddPosition] = oddWrap(array[oddPosition]);
                expect(abstractDeepEqual(mix1, mix2))
                    .withContext(`hashArray ${index} ${map(shuffWrap, 'name')}`)
                    .toBe(false);
            });
        });
    });

    it('recursively compares structures with arbitrary nesting', function() {
        const base: any = {
            a: 'x',
            b: [
                null,
                ['a', 'b', NaN],
                {
                    p: 'q',
                    r: { a: 'xyz', b: 1 },
                    s: [{ x: false }],
                },
                20,
            ],
            c: [{
                a: 1,
                b: 2,
            }, {
                a: {
                    p: {
                        x: [1, 2, 3],
                        y: '123',
                    },
                    q: true,
                    r: { x: 0 }
                },
                b: [{
                    p: 0,
                    q: 'abc',
                    r: undefined,
                }, {
                    p: { x: 'x' },
                    q: { x: 'y' },
                }],
                c: {
                    p: [],
                    q: {},
                },
            }, {
                a: [0, 0, 0, 0, 0],
                b: {
                    p: null,
                    q: { x: null },
                },
            }],
        };
        // Two very subtly different versions of the above datastructure.
        const variant1 = extend({}, base, {
            b: extend(base.b.slice(), {
                2: extend({}, base.b[2], {
                    r: extend({}, base.b[2].r, { b: 2 }),
                }),
            }),
        });
        const variant2 = extend({}, base, {
            c: extend(base.c.slice(), {
                1: extend({}, base.c[1], {
                    b: extend(base.c[1].b.slice(), {
                        1: extend({}, base.c[1].b[1], {
                            q: extend({}, base.c[1].b[1].q, { y: 'z' }),
                        }),
                    }),
                }),
            }),
        });
        expect(base.b[2].r.b).toBe(1);
        expect(variant2.b[2].r.b).toBe(1);
        expect(variant1.b[2].r.b).toBe(2);
        expect(base.c[1].b[1].q.y).toBe(undefined);
        expect(variant1.c[1].b[1].q.y).toBe(undefined);
        expect(variant2.c[1].b[1].q.y).toBe('z');
        times(20, () => {
            const hashOrder = shuffle(hashWrappers);
            const arrayOrder = shuffle(arrayWrappers);
            const ctx = `${map(hashOrder, 'name')} ${map(arrayOrder, 'name')}`;
            const wrap = mixedWrap(hashOrder, arrayOrder);
            const a = wrap(base), b = wrap(base),
                c = wrap(variant1), d = wrap(variant2);
            expect(abstractDeepEqual(a,b)).withContext(`ab ${ctx}`).toBe(true);
            expect(abstractDeepEqual(b,a)).withContext(`ba ${ctx}`).toBe(true);
            expect(abstractDeepEqual(a,c)).withContext(`ac ${ctx}`).toBe(false);
            expect(abstractDeepEqual(c,a)).withContext(`ca ${ctx}`).toBe(false);
            expect(abstractDeepEqual(a,d)).withContext(`ad ${ctx}`).toBe(false);
            expect(abstractDeepEqual(d,a)).withContext(`da ${ctx}`).toBe(false);
            expect(abstractDeepEqual(c,d)).withContext(`cd ${ctx}`).toBe(false);
            expect(abstractDeepEqual(d,c)).withContext(`dc ${ctx}`).toBe(false);
        });
    });

    it('recursively compares to arbitrary depth', function() {
        let x: any = {};
        times(50, () => x = { x });
        expect(x.x.x.x.x.x.x).toEqual({ x: jasmine.any(Object) });
        expect(abstractDeepEqual(x, x)).withContext('xx').toBe(true);
        expect(abstractDeepEqual(x, x.x)).withContext('x.').toBe(false);
        expect(abstractDeepEqual(x.x, x)).withContext('.x').toBe(false);
        expect(abstractDeepEqual(x.x, x.x)).withContext('..').toBe(true);
    });
});
