import { keys, every, isObject, isFunction, isNumber } from 'lodash';
import { Model, Collection } from 'backbone';

/**
 * Recursively compare the contents of two nested data structures.
 * This function is similar to _.isEqual, with two main differences:
 *
 *  1. It is Backbone-aware and content-only. When two models or collections
 *     have unequal .cids or different bound event handlers, they can still
 *     compare equal if they have the same attributes or models. They must
 *     however have the exact same class.
 *  2. It is less sophisticated. It does not correctly handle special data
 *     types such as ArrayBuffer, Error or RegExp and it will break on cyclical
 *     references.
 *
 * For the above reasons, it is very useful in tests, but possibly unsafe for
 * production. If you need a Backbone-aware deep comparison in production, you
 * may need to address some of this function's shortcomings first.
 */
export default function abstractDeepEqual(left: any, right: any): boolean {
    // object identity always counts as equality
    if (left === right) return true;
    // handle NaN in case it ever comes up
    if (left !== left) return right !== right;
    // primitives and functions must otherwise compare identical
    if (!isObject(left) || !isObject(right)) return false;
    if (isFunction(left)) return false;
    // in remaining cases, we require equal types and equal content
    if (left.constructor !== right.constructor) return false;
    if (isFunction(left.valueOf)) {
        // Some special built-in types such as `Date` as well as object wrappers
        // such as `String` have a "backdoor" of sorts that enable us to make
        // efficient primitive value comparisons.
        const primitive = left.valueOf();
        if (!isObject(primitive)) {
            return abstractDeepEqual(primitive, right.valueOf());
        }
    }
    // the Backbone-aware part: ignore everything except for the content
    if (left instanceof Model) {
        return abstractDeepEqual(left['attributes'], right['attributes']);
    }
    if (left instanceof Collection) {
        return abstractDeepEqual(left['models'], right['models']);
    }
    // We end up iterating both values either as plain arrays or plain objects.
    // We want to avoid a situation where one is iterated as array while the
    // other is iterated as object, so either both or neither must have numeric
    // .length properties. We also don't want to be fooled by left being a
    // prefix of right, so we check that the number of indices or keys in both
    // values is the same.
    const lengthL = left['length'];
    const lengthR = right['length'];
    if (isNumber(lengthL)) {
        if (lengthR !== lengthL) return false;
    } else if (isNumber(lengthR) || keys(left).length !== keys(right).length) {
        return false;
    }
    // final generic recursive iteration (`key` might also be a numerical index)
    return every(left, (value, key) => abstractDeepEqual(value, right[key]));
}
