/**
 * Given user input as a bare string, this module enables us to identify the
 * most fitting XSD data type, given any type constraints.
 *
 * The logic in this module was based on the following specification:
 * https://www.w3.org/TR/2004/REC-xmlschema-2-20041028/.
 */

import { find, filter, partial } from 'lodash';

import { xsd, rdfs } from '../common-rdf/ns';
import Graph from '../common-rdf/graph';

// When the user enters a numeric notation, we not only check that the notation
// is correct, but also that the number represented fits in the corresponding
// datatype. For IEEE floats, this is a bit involved. Since xsd:double is the
// same IEEE double-precision floating point type as is built into JavaScript,
// we can use a two-sided approach: coerce the text to `Number`, then look back
// at the original string to verify that the most significant digits haven't
// been lost. Such loss could happen if the user ventures outside of the
// available range or precision of the datatype.
//
// The function below is used in the `check` property of the floating point
// matchers listed further down. The `value` argument already holds the result
// of coercing the user string to `Number`. The `[whole,, mantissa]` array
// argument holds the result of the already successfully matched regular
// expression for floating point numbers.
function checkDouble(value: number, [whole,, mantissa]: string[]): boolean {
    if (value === Infinity || value === -Infinity) {
        // Infinity could result from overly large values such as 1e2000, so we
        // check whether the user actually intended infinity.
        return whole === 'INF' || whole === '-INF';
    }
    // Likewise for NaN, although this should never happen with valid notation.
    if (value !== value) return whole === 'NaN';
    // The opposite applies to zero as for infinity, e.g. 1e-2000.
    if (value === 0) return +mantissa === 0;
    return true;
}

// A mapping of text patterns to XSD types, roughly from most to least specific
// pattern and where possible, from most to least commonly used type (this was
// not possible for xsd:string, because it accepts all possible inputs, so you
// find it near the end). Since some patterns are ambiguous, the same type can
// occur multiple times with increasingly inclusive patterns. Numeric type
// matchers may include some additional properties for range checking. Within
// the xsd:string and xsd:integer type hierarchies, types are listed from widest
// to narrowest. This ensures that narrower types are selected only when wider
// types aren't permitted.
// If `interpretText` is giving undesired results for some inputs, you most
// likely need to adjust the order or contents of this array.
const prioritizedMatchers = [{
    pattern: /^([1-9]\d{3}(\d{4})*)?\d{4}$/,
    type: xsd.hexBinary,
    ambiguous: [xsd.gYear, xsd.integer, xsd.base64Binary],
}, {
    pattern: /^([1-9]\d(\d\d)*)?\d{4}$/,
    type: xsd.hexBinary,
    ambiguous: [xsd.gYear, xsd.integer],
}, {
    pattern: /^(\d{4})+$/,
    type: xsd.hexBinary,
    ambiguous: [xsd.integer, xsd.base64Binary],
}, {
    pattern: /^(\d\d)+$/,
    type: xsd.hexBinary,
    ambiguous: [xsd.integer],
}, {
    pattern: /^-?([1-9]\d*)?\d{4}$/,
    type: xsd.gYear,
    ambiguous: [xsd.integer],
}, {
    pattern: /^[+-]?\d+$/,
    type: xsd.integer,
    restricts: xsd.decimal,
}, {
    pattern: /^(-?0|\+?\d+)$/,
    type: xsd.nonNegativeInteger,
    restricts: xsd.integer,
}, {
    pattern: /^(\+?0|-\d+)$/,
    type: xsd.nonPositiveInteger,
    restricts: xsd.integer,
}, {
    pattern: /^\+?(?!0$)\d+$/,
    type: xsd.positiveInteger,
    restricts: xsd.nonNegativeInteger,
}, {
    pattern: /^-(?!0$)\d+$/,
    type: xsd.negativeInteger,
    restricts: xsd.nonPositiveInteger,
}, {
    pattern: /^[+-]?0*\d{1,19}$/,
    type: xsd.long,
    restricts: xsd.integer,
    cast: Number,
    // The bounds for long, unsignedLong, int and unsignedInt are beyond the
    // maximum precision of JavaScript's built-in numeric type, so bounds
    // checking will only be approximate for these types.
    min: -9223372036854775808,
    max: 9223372036854775807,
}, {
    pattern: /^(-?0|\+?0*\d{1,20})$/,
    type: xsd.unsignedLong,
    restricts: xsd.nonNegativeInteger,
    cast: Number,
    max: 18446744073709551615,
}, {
    pattern: /^[+-]?0*\d{1,10}$/,
    type: xsd.int,
    restricts: xsd.long,
    cast: Number,
    min: -2147483648,
    max: 2147483647,
}, {
    pattern: /^(-?0|\+?0*\d{1,10})$/,
    type: xsd.unsignedInt,
    restricts: xsd.unsignedLong,
    cast: Number,
    max: 4294967295,
}, {
    pattern: /^[+-]?0*\d{1,5}$/,
    type: xsd.short,
    restricts: xsd.int,
    cast: Number,
    min: -32768,
    max: 32767,
}, {
    pattern: /^(-?0|\+?0*\d{1,5})$/,
    type: xsd.unsignedShort,
    restricts: xsd.unsignedInt,
    cast: Number,
    max: 65535,
}, {
    pattern: /^[+-]?0*\d{1,3}$/,
    type: xsd.byte,
    restricts: xsd.short,
    cast: Number,
    min: -128,
    max: 127,
}, {
    pattern: /^(-?0|\+?0*\d{1,3})$/,
    type: xsd.unsignedByte,
    restricts: xsd.unsignedShort,
    cast: Number,
    max: 255,
}, {
    pattern: /^[+-]?(\d+|\d*\.?\d+)$/,
    type: xsd.decimal,
}, {
    pattern: /^([+-]?(\d*\.?\d+)([eE][+-]?\d+)?|-?INF|NaN)$/,
    type: xsd.double,
    cast: Number,
    check: checkDouble,
}, {
    pattern: /^([+-]?(\d*\.?\d+)([eE][+-]?\d+)?|-?INF|NaN)$/,
    type: xsd.float,
    restricts: xsd.double,
    cast: Number,
    check(value: number, match: string[]): boolean {
        if (!checkDouble(value, match)) return false;
        value = Math.abs(value);
        return Math.pow(2, -149) <= value && value < Math.pow(2, 128);
    },
}, {
    // The boolean pattern, while very specific, is included only after all
    // numeric types because these get precedence on the `1|0` part of the
    // pattern.
    pattern: /^(true|false|1|0)$/,
    type: xsd.boolean,
}, {
    pattern: /^-?([1-9]\d*)?\d{4}-\d\d-\d\d(Z|[+-]\d\d:\d\d)?$/,
    type: xsd.date,
}, {
    pattern: /^-?([1-9]\d*)?\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(Z|[+-]\d\d:\d\d)?$/,
    type: xsd.dateTime,
}, {
    pattern: /^\d\d:\d\d:\d\d(\.\d+)?(Z|[+-]\d\d:\d\d)?$/,
    type: xsd.time,
}, {
    pattern: /^-?P(?=\d+|T)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d+)(\d+H)?(\d+M)?(\d+(\.\d+)S)?)?$/,
    type: xsd.duration,
}, {
    pattern: /^-?([1-9]\d*)?\d{4}(Z|[+-]\d\d:\d\d)?$/,
    type: xsd.gYear,
}, {
    pattern: /^--\d\d(Z|[+-]\d\d:\d\d)?$/,
    type: xsd.gMonth,
}, {
    pattern: /^---\d\d(Z|[+-]\d\d:\d\d)?$/,
    type: xsd.gDay,
}, {
    pattern: /^-?([1-9]\d*)?\d{4}-\d\d(Z|[+-]\d\d:\d\d)?$/,
    type: xsd.gYearMonth,
}, {
    pattern: /^--\d\d-\d\d(Z|[+-]\d\d:\d\d)?$/,
    type: xsd.gMonthDay,
}, {
    pattern: /^([0-9a-fA-F]{4})+$/,
    type: xsd.hexBinary,
    ambiguous: [xsd.base64Binary],
}, {
    pattern: /^([0-9a-fA-F]{2})+$/,
    type: xsd.hexBinary,
}, {
    pattern: /^(([a-zA-Z0-9+/]\s*){4})*([a-zA-Z0-9+/]\s*([AQgw]\s*=|[a-zA-Z0-9+/]\s*[AEIMQUYcgkosw048])\s*=\s*)?$/,
    type: xsd.base64Binary,
}, {
    pattern: /[^]*/,
    type: xsd.string,
}, {
    pattern: /^[^\r\n\t]*$/,
    type: xsd.normalizedString,
    restricts: xsd.string,
}, {
    pattern: /^ ?(\S* ?)*$/,
    type: xsd.token,
    restricts: xsd.normalizedString,
}, {
    pattern: /^ ?[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*$/,
    type: xsd.language,
    restricts: xsd.token,
}];

// Protip: let TypeScript figure out the complex types for you.
type Descriptor = typeof prioritizedMatchers[number];

// Given a range, a type is permitted either by being explicitly listed or by
// not being excluded.
function rangeIncludes(range: Graph, type: string): boolean {
    return !range.length || !!range.get(type) || !!range.get(rdfs.Literal);
}

// Core internal iteratee for `find` that checks whether one of the
// `prioritizedMatchers` above matches a piece of user text, given the range of
// allowed types. A set of types that previously failed to match is consulted
// (and updated in place), in order to optimize away some unneeded
// pattern-matching.
// NOTE: this evaluates only one descriptor at a time!
function matchType(
    range: Graph, failed: Set<string>, text: string, descriptor: Descriptor
): boolean {
    if (!rangeIncludes(range, descriptor.type)) return false;
    if (failed.has(descriptor.restricts) || !descriptor.pattern.test(text)) {
        failed.add(descriptor.type);
        return false;
    }
    if (descriptor.cast) {
        const casted = descriptor.cast(text);
        const match = descriptor.check ? descriptor.pattern.exec(text) : null;
        if (
            descriptor.min && casted < descriptor.min ||
            descriptor.max && descriptor.max < casted ||
            match && !descriptor.check(casted, match)
        ) {
            failed.add(descriptor.type);
            return false;
        }
    }
    return true;
}

// Regarding that protip from above... TS isn't always smart enough. This is the
// return type of our exported `interpretText` function.
export interface Interpretation {
    // The `jsonld` field can be passed straight to `Node.set`.
    jsonld: {
        '@value': string,
        '@type': string,
    };
    // If other types would have been possible for the same string, this field
    // will list them. Otherwise `undefined`.
    ambiguous?: string[];
}

/**
 * Pass a string of user input and optionally a range of allowed types. Returns
 * an `Interpretation` if a match is found, `undefined` otherwise. Users can
 * prepend a space to force interpretation as a string type, prepend a + sign
 * (if nonnegative) or one or two zeros to force interpretation as a numeric
 * type, append a 'Z' or time zone notation to force interpretation of integers
 * with four or more digits as a Gregorian year (xsd.gYear), or include
 * internal whitespace to force interpretation as xsd:base64Binary. A prepended
 * space will be trimmed off in the resulting interpretation in order to keep
 * the data reasonably clean.
 */
export default
function interpretText(text: string, allowedRange: Graph = new Graph()) {
    const matchAllowedType = partial(matchType, allowedRange, new Set(), text);
    const matched = find(prioritizedMatchers, matchAllowedType);
    if (!matched) return;
    const allowedRangeIncludes = partial(rangeIncludes, allowedRange);
    const result: Interpretation = {
        jsonld: {
            '@value': text.trim(),
            '@type': matched.type,
        },
        ambiguous: filter(matched.ambiguous || [], allowedRangeIncludes),
    };
    return result;
}
