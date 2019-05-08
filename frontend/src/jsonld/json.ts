export type JsonValue = null | boolean | number | string | JsonObject | JsonArray;
export type JsonArray = JsonValue[];
export interface JsonObject {
    [key: string]: JsonValue;
}
export type JsonCollection = JsonObject[];
export type JsonDocument = JsonObject | JsonCollection;
export type JsonLdContext = null | string | JsonObject | JsonLdContext[];
