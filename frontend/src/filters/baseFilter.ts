export abstract class BaseFilter {
    abstract type: FilterTypes;
    abstract name: string;

    // TODO: implement proper way to get values (from different types, e.g. an IValue?)
    abstract value: string | number | string[] = undefined;
}

export enum FilterTypes {
    MultiSelect = 1,
}