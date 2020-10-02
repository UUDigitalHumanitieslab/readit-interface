import { reduce } from 'lodash';

/**
 * _.reduce iteratee for the mixinSingle function below.
 */
function amendNonCtorProperty(target, descriptor, key) {
    if (key !== 'constructor') Object.defineProperty(target, key, descriptor);
    return target;
}

/**
 * _.reduce iteratee for the mixin function below.
 */
function mixinSingle<T>(target: T, source: any) {
    const props = Object.getOwnPropertyDescriptors(source);
    return reduce(props, amendNonCtorProperty, target);
}

/**
 * This function can be used to mix additional properties into a class
 * prototype, like _.extend. The difference with _.extend is that it will also
 * copy non-enumerable properties such as getters and setters.
 *
 * Not to be confused with _.mixin, which adds functions to the Underscore
 * (Lodash) object!
 */
export default function mixin<T>(target: T, ...sources: any[]) {
    return reduce(sources, mixinSingle, target);
}
