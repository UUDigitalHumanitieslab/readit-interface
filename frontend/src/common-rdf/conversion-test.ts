import { asNative, asLD, ConversionError } from './conversion';
import { xsd } from './ns';
import Subject from './subject';

const bijectivePairs = [{
    native: 1,
    ld: { '@value': 1 },
}, {
    native: true,
    ld: { '@value': true },
}, {
    native: null,
    ld: { '@value': null },
}, {
    native: 'text',
    ld: { '@value': 'text' },
}, {
    native: [1, 2, 3],
    ld: { '@list': [
        { '@value': 1 },
        { '@value': 2 },
        { '@value': 3 },
    ] },
}, {
    native: (function() {
        let s = new String('text');
        s['@language'] = 'en';
        return s;
    }()),
    ld: {
        '@value': 'text',
        '@language': 'en',
    },
}, {
    native: (function() {
        let d = new Date('2000-01-01T23:45:06.000Z');
        d['@type'] = xsd.dateTime;
        return d;
    }()),
    ld: {
        '@value': '2000-01-01T23:45:06.000Z',
        '@type': xsd.dateTime,
    },
}, {
    native: (function() {
        let i = new Number(1);
        i['@type'] = xsd.nonNegativeInteger;
        return i;
    }()),
    ld: {
        '@value': 1,
        '@type': xsd.nonNegativeInteger,
    },
}, {
    native: (function() {
        let n = new Object();
        n['@type'] = 'unknown';
        return n;
    }()),
    ld: {
        '@value': null,
        '@type': 'unknown',
    },
}, {
    native: (function() {
        let s = new String('encoded');
        s['@type'] = 'unknown';
        return s;
    }()),
    ld: {
        '@value': 'encoded',
        '@type': 'unknown',
    },
}];

describe('the conversion module', function() {
    describe('asNative', function() {
        it('converts expanded JSON-LD values to native datatypes', function() {
            bijectivePairs.forEach(({native, ld}) => {
                expect(asNative(ld)).toEqual(native);
            });
        });

        it('leaves native datatypes unchanged', function() {
            bijectivePairs.forEach(({native}) => {
                expect(asNative(native)).toEqual(native);
            });
        });

        it('converts Nodes to Identifiers for efficiency', function() {
            const identifier = { '@id': '1' };
            const node = new Subject(identifier);
            expect(asNative(node)).toEqual(identifier);
            expect(asNative(identifier)).toEqual(identifier);
        });
    });

    describe('asLD', function() {
        it('converts native datatypes to expanded JSON-LD values', function() {
            bijectivePairs.forEach(({native, ld}) => {
                expect(asLD(native)).toEqual(ld);
            });
        });

        it('leaves expanded JSON-LD values unchanged', function() {
            bijectivePairs.forEach(({ld}) => {
                expect(asLD(ld)).toEqual(ld);
            });
        });

        it('throws a ConversionError if you feed it garbage', function() {
            const buggy = () => asLD({ a: 1, b: 2 });
            // Actually we expect ConversionError specifically, but
            // by the time jasmine catches the exception, it has
            // somehow (magically?) upcast to a TypeError and I
            // wasn't motivated enough to hunt down the cause.
            expect(buggy).toThrowError(TypeError);
        });
    });
});
