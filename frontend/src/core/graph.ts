import { extend, isUndefined, isArray } from 'lodash';
import { compact, flatten, expand } from 'jsonld';

import { JsonValue, JsonObject, JsonArray, JsonCollection, JsonDocument } from './json';
import Model from './model';
import Collection from './collection';

function isDefined(arg: any): boolean {
    return !isUndefined(arg);
}

export type JsonLdContext = string | JsonArray | JsonObject | null;
export type JsonLdContextOpt = JsonLdContext | undefined;

/**
 * Representation of a single JSON-LD object with an @id.
 * Mostly for internal use, as the model type for Graph.
 */
export class Node extends Model {
    /**
     * attributes must be pure JSON; this is a restriction from Model.
     */
    attributes: JsonObject;

    /**
     * The ctor allows you to set/override the context on creation.
     * Please note that the context management logic runs only AFTER
     * your initialize method, if you define one.
     */
    constructor(attributes, options) {
        super(attributes, options);
        let newContext: JsonLdContextOpt = options.context;
        if (isDefined(newContext)) {
            this.context = newContext;
        }
    }

    /**
     * Get the Graph-aware context. See
     * https://w3c.github.io/json-ld-syntax/#advanced-context-usage
     */
    get context(): JsonLdContextOpt {
        let globalContext = this.collection && this.collection.context;
        let localContext: JsonLdContextOpt = this.get('@context');
        if (isDefined(localContext)) {
            if (isDefined(globalContext)) {
                if (!isArray(globalContext)) globalContext = [globalContext];
                return globalContext.concat(localContext);
            }
            return localContext;
        }
        return globalContext;
    }

    /**
     * Set/replace the local context and (TODO)
     */
    set context(newContext?: JsonLdContext) {
    }
}