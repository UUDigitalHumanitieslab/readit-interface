import {
    has,
    map,
    isArray,
    isString,
    isNumber,
    isInteger,
    isBoolean,
    isNull,
} from 'lodash';

import {
    FlatSingleValue,
    FlatTypedLiteral,
    FlatLiteral,
    Identifier,
} from './json';
import { xsd } from './ns';
import Node from './node';

const knownConversions = {
    [xsd.integer]: {
        toLD(int: number): FlatTypedLiteral {
            return { '@value': int };
        }
        fromLD(value: FlatTypedLiteral): number {
            return +value['@value'];
        }
    },
    [xsd.nonNegativeInteger]: {
        toLD(int: number): FlatTypedLiteral {
            return {
                '@value': int,
                '@type': xsd.nonNegativeInteger,
            };
        }
        fromLD(value: FlatTypedLiteral): number {
            let obj = new Object(+value['@value']);
            obj['@type'] = xsd.nonNegativeInteger;
            return obj;
        }
    },
    [xsd.double]: {
        toLD(double: number): FlatTypedLiteral {
            return { '@value': double };
        }
        fromLD(value: FlatTypedLiteral): number {
            return +value['@value'];
        }
    },
    [xsd.boolean]: {
        toLD(bool: boolean): FlatTypedLiteral {
            return { '@value': bool };
        }
        fromLD(value: FlatTypedLiteral): boolean {
            return !!value['@value'];
        }
    },
    [xsd.string]: {
        toLD(str: string): FlatLiteral {
            return { '@value': str };
        }
        fromLD(value: FlatLiteral): string {
            return value['@value'].toString();
        }
    },
    [xsd.dateTime]: {
        toLD(date: Date): FlatTypedLiteral {
            return {
                '@value': date.toJSON(),
                '@type': xsd.dateTime,
            };
        }
        fromLD(value: FlatTypedLiteral): Date {
            return new Date(value['@value']);
        }
    },
};

// Native includes Identifier as an optimization.
export type Native = number | boolean | null | string | Date | Identifier | NativeArray;
export interface NativeArray extends Array<Native> { };

/**
 * Unwrap a single expanded JSON-LD value to native or return
 * unmodified if already native.
 */
export function asNative(obj: any): Native {
    if (isString(obj['@id'])) return obj;
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
