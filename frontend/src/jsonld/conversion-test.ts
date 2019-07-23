import { asNative, asLD, ConversionError } from './conversion';
import { xsd } from './ns';
import Node from './node';

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
    native: new Date('2000-01-01T23:45:06.000Z'),
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
}, /*
{
    native: ,
    ld: {},
}, */
]

describe('the conversion module', function() {
    describe('asNative', function() {
        it('converts expanded JSON-LD values to native datatypes', function() {
            bijectivePairs.forEach(({native, ld}) => {
                expect(asNative(ld)).toEqual(native);
            });
        });
    });
});
