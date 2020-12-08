import { isString } from 'lodash';

export type Prefix = NonNullable<string>;

export type Namespace<Names extends Readonly<string[]>> = {
    [key in Names[number]]: string;
} & {
    (suffix?: string): string;
}

export default function Vocabulary<
    Names extends Readonly<string[]>
>(prefix: Prefix, terms: Names): Namespace<Names> {
    function vocab(suffix?: string) {
        if (isString(suffix)) return prefix + suffix;
        return prefix;
    }
    terms.forEach(term => vocab[term] = vocab(term));
    return vocab as Namespace<Names>;
}
