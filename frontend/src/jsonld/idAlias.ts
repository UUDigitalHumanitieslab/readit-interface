import { isNull, isString, isArray, reduceRight, findKey } from 'lodash';

import { JsonValue, ResolvedContext } from './json';

export const standardIdAttribute = '@id';

/**
 * Find out if the provided context aliases the @id attribute. If so,
 * return the alias, otherwise return undefined.
 * @param {ResolvedContext} context A fully resolved context (must not
 *                                  contain external contexts).
 * @return {string | undefined}     The alias, if defined.
 */
export default function computeIdAlias(context: ResolvedContext): string {
    if (isNull(context)) return;
    if (isString(context)) throw new TypeError('Context is not fully resolved.');
    if (isArray(context)) return reduceRight(context, reduceArray, undefined);
    let nested = context['@context'];
    if (nested) return computeIdAlias(nested);
    return findKey(context, isIdAttribute);
}

function reduceArray(accumulator: string, context: ResolvedContext): string {
    // If we already found an alias in a previous element, we are
    // done, so just stick with that result.
    if (accumulator) return accumulator;
    // Otherwise, check whether the current element might have one.
    return computeIdAlias(context);
}

function isIdAttribute(value: JsonValue): boolean {
    if (!value) return false;
    if (value === standardIdAttribute) return true;
    return value[standardIdAttribute] === standardIdAttribute;
}
