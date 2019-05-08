export type JsonAtomic = null | boolean | number | string;
export type JsonValue = JsonAtomic | JsonObject | JsonArray;
export type JsonArray = JsonValue[];
export interface JsonObject {
    [key: string]: JsonValue;
}
export type JsonCollection = JsonObject[];
export type JsonDocument = JsonObject | JsonCollection;
export type JsonLdContext = null | string | JsonObject | JsonLdContext[];
export type ResolvedContext = null | JsonObject | JsonLdContext[];
