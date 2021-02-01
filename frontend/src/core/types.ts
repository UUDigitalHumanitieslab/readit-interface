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
