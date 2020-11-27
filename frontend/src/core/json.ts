import { FirstTypeIntendedSecondTypeWorkaround } from './types';

// Core JSON types
export type JsonAtomic = null | boolean | number | string;
export type JsonValue = JsonAtomic | JsonObject | JsonArray;
export interface JsonArray extends Array<JsonValue> { }
export interface JsonObject {
    [key: string]: JsonValue;
}

// JSON API-oriented types
export type JsonCollection = JsonObject[];
export type JsonDocument = JsonObject | JsonCollection;

// JSON-LD specialized types
export interface Identifier {
    ['@id']: string;
}

export function isIdentifier(candidate: any): candidate is Identifier {
    return !!candidate['@id'];
}

// Compacted JSON-LD
export type JsonLdContext = null | string | ContextContainer | ContextArray;
export interface ContextArray extends Array<JsonLdContext> { }
export interface ContextContainer extends JsonObject {
    ['@context']?: JsonLdContext;
}

export type ResolvedContext = null | ResolvedContainer | ResolvedArray;
export interface ResolvedArray extends Array<ResolvedContext> { }
export interface ResolvedContainer extends JsonObject {
    ['@context']?: ResolvedContext;
}

export type JsonLdDocument = JsonLdObject | JsonLdGraph;
export interface JsonLdGraph extends Array<JsonLdObject> { };
export interface JsonLdObject extends ContextContainer, Partial<Identifier> {
    ['@graph']?: JsonLdGraph;
}

// Flattened and expanded JSON-LD
export interface ValueContainer {
    ['@value']: JsonAtomic;
}
export interface ValueTyping {
    ['@type']?: string;
}
export interface ValueLocalization {
    ['@language']?: string;
}
export type ValueModifier = ValueTyping | ValueLocalization;
export type FlatTypedLiteral = ValueContainer & ValueTyping;
export type FlatLocalizedLiteral = ValueContainer & ValueLocalization;
export type FlatLiteral = ValueContainer & ValueModifier;
export interface FlatList {
    ['@list']: FlatValue;
}
export type FlatSingleValue = Identifier | FlatLiteral | FlatList;
export interface FlatValue extends Array<FlatSingleValue> {}

export interface FlatLdObject extends Identifier {
    ['@type']?: Array<string>;
    [iri: string]: FirstTypeIntendedSecondTypeWorkaround<FlatValue, string | Array<string>>;
}
export interface FlatLdGraph extends Array<FlatLdObject> { }
export interface FlatGraphContainer extends FlatLdObject {
    ['@graph']?: FlatLdGraph;
}
export type FlatLdDocument = FlatLdGraph | FlatGraphContainer;
