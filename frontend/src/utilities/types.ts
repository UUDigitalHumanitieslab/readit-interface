import Model from '../core/model';
import Collection from '../core/collection';
import { Identifier } from '../jsonld/json';
import Node from '../jsonld/node';
import Graph from '../jsonld/graph';

/**
 * Some type guards for common use.
 */

export function isIdentifier(candidate: any): candidate is Identifier {
    return !!candidate['@id'];
}

export function isNode(candidate: any): candidate is Node {
    return candidate instanceof Node;
}

export function isGraph(candidate: any): candidate is Graph {
    return candidate instanceof Graph;
}

export type ReadOnlyCollection<M extends Model = Model> = Omit<Collection<M>,
    'preinitialize' | 'initialize' | 'sync' | 'add' | 'remove' | 'reset' |
    'set' | 'push' | 'pop' | 'unshift' | 'shift' | 'sort' | 'fetch' | 'create'
>;

export type ReadOnlyGraph = Omit<Graph,
    'preinitialize' | 'initialize' | 'sync' | 'add' | 'remove' | 'reset' |
    'set' | 'push' | 'pop' | 'unshift' | 'shift' | 'sort' | 'fetch' | 'create' |
    'context' | 'parse'
>;

/**
 * Self-documenting workaround for a common situation TypeScript
 * cannot handle. Damn you, TypeScript!
 *
 * Interfaces like the following are common in JavaScript:

    {
        fixedKey: TypeA;
        [variableKey: string]: TypeB;
    }

 * but TypeScript won't let you define such a type if TypeA is not a
 * subtype of TypeB. The utility type below lets you write a
 * self-documenting compromise so at least your code will compile:

    interface Example {
        fixedKey: TypeA;
        [variableKey: string]: FirstTypeIntendedSecondTypeWorkaround<TypeB, TypeA>;
    }

 * The consequence is that TypeScript will not detect all possible
 * type errors. It will still stop you from doing the following,
 * however, if TypeC is neither a subtype of TypeA nor TypeB:

    let example: Example = {
        fixedKey: instanceOfTypeA,
        aDifferentKey: instanceOfTypeC,
    }

 * If there are multiple fixed keys of different incompatible types,
 * simply make the second type a union of all those types:

    interface Example2 {
        fixedKey1: TypeA;
        fixedKey2: TypeB;
        fixedKey3: TypeC;
        [variableKey: string]: FirstTypeIntendedSecondTypeWorkaround<TypeD, TypeA | TypeB | TypeC>;
    }
 */
export type FirstTypeIntendedSecondTypeWorkaround<T, U> = T | U;
