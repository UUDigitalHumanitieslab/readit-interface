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

// JSON-LD context types
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
