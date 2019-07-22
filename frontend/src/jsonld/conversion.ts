import {
    map,
    isArray,
    isString,
    isNumber,
    isInteger,
    isBoolean,
    isNull,
} from 'lodash';

import { FlatSingleValue, FlatTypedLiteral, FlatLiteral } from './json';
import { xsd } from './ns';

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
