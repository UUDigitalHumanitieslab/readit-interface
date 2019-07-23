import {
    has,
    map,
    keys,
    overSome,
    isArray,
    isString,
    isNumber,
    isInteger,
    isBoolean,
    isNull,
    isObject,
} from 'lodash';

import {
    FlatSingleValue,
    FlatTypedLiteral,
    FlatLiteral,
    Identifier,
} from './json';
import { xsd } from './ns';
import Node from './node';

// Native includes Identifier as an optimization.
export type Native = number | boolean | null | string |
                     Number | Boolean | Object | String |
                     Date | Identifier | NativeArray;
export interface NativeArray extends Array<Native> { };

interface Conversion {
    toLD(arg: any): FlatLiteral;
    fromLD(arg: any): Native;
}
interface ConversionTable {
    [iri: string]: Conversion;
}

const knownConversions: ConversionTable = {
    [xsd.integer]: {
        toLD(int: number): FlatTypedLiteral {
            return { '@value': int };
        },
        fromLD(value: FlatTypedLiteral): number {
            return +value['@value'];
        },
    },
    [xsd.nonNegativeInteger]: {
        toLD(int: number): FlatTypedLiteral {
            return {
                '@value': int,
                '@type': xsd.nonNegativeInteger,
            };
        },
        fromLD(value: FlatTypedLiteral): Number {
            let obj = new Number(value['@value']);
            obj['@type'] = xsd.nonNegativeInteger;
            return obj;
        },
    },
    [xsd.double]: {
        toLD(double: number): FlatTypedLiteral {
            return { '@value': double };
        },
        fromLD(value: FlatTypedLiteral): number {
            return +value['@value'];
        },
    },
    [xsd.boolean]: {
        toLD(bool: boolean): FlatTypedLiteral {
            return { '@value': bool };
        },
        fromLD(value: FlatTypedLiteral): boolean {
            return !!value['@value'];
        },
    },
    [xsd.string]: {
        toLD(str: string): FlatLiteral {
            return { '@value': str };
        },
        fromLD(value: FlatLiteral): string {
            return value['@value'].toString();
        },
    },
    [xsd.dateTime]: {
        toLD(date: Date): FlatTypedLiteral {
            return {
                '@value': date.toJSON(),
                '@type': xsd.dateTime,
            };
        },
        fromLD(value: FlatTypedLiteral): Date {
            return new Date(value['@value'] as string);
        },
    },
};

/**
 * Unwrap a single expanded JSON-LD value to native or return
 * unmodified if already native.
 */
export function asNative(obj: any): Native {
    if (obj && isString(obj['@id'])) return obj;
    if (has(obj, '@value')) {
        const value = obj['@value'];
        if (has(obj, '@type')) {
            const type = obj['@type'];
            const conversion = knownConversions[type];
            if (conversion) return conversion.fromLD(obj);
            let native = new Object(value);
            native['@type'] = type;
            return native;
        }
        if (has(obj, '@language')) {
            let native = new String(value);
            native['@language'] = obj['@language'];
            return native;
        }
        return value;
    }
    if (has(obj, '@list')) obj = obj['@list'];
    if (isArray(obj)) return map(obj, asNative);
    if (obj instanceof Node) return { '@id': obj.id };
    return obj;
}

export class ConversionError extends TypeError {
    offendingValue: any;
    constructor(message, value) {
        super(message);
        this.offendingValue = value;
    }
}

ConversionError.prototype.name = 'ConversionError';

/**
 * Encode a single native value as JSON-LD or return unmodified if it
 * is already JSON-LD.
 */
export function asLD(obj: any): FlatSingleValue {
    if (has(obj, '@id') || has(obj, '@value') || has(obj, '@list')) return obj;
    if (has(obj, '@type')) {
        const type = obj['@type'];
        const conversion = knownConversions[type];
        if (conversion) return conversion.toLD(obj);
        if (isObject(obj)) {
            const objKeys = keys(obj);
            if (objKeys.length === 1 && objKeys[0] === '@type') return {
                '@value': null,
                '@type': type,
            };
        }
        return {
            '@value': obj,
            '@type': type,
        };
    }
    if (has(obj, '@language')) return {
        '@value': obj,
        '@language': obj['@language'],
    };
    if (isArray(obj)) return { '@list': map(obj, asLD) };
    if (overSome(isNumber, isBoolean, isNull, isString)(obj)) return {
        '@value': obj,
    };
    throw new ConversionError('No available conversion to JSON-LD', obj);
}
