import { extend, isUndefined, isArray } from 'lodash';
import {
    compact,  // (jsonld, ctx, options?, callback?) => Promise<jsonld>
    expand,   // (jsonld, options?, callback?) => Promise<jsonld>
    flatten,  // (jsonld, ctx, options?, callback?) => Promise<jsonld>
    processContext,  // (activeCtx, localCtx, options?, callback?) => Promise<ctx>
    fromRDF,  // (string, options?, callback?) => Promise<jsonld>
    toRDF,    // (jsonld, options?, callback?) => Promise<dataset>
    registerRDFParser,  // (contentType, parser) => void
} from 'jsonld';

import { JsonValue, JsonObject, JsonArray, JsonCollection, JsonDocument } from './json';
import Model from './model';
import Collection from './collection';

function isDefined(arg: any): boolean {
    return !isUndefined(arg);
}

export type JsonLdContext = null | string | JsonObject | JsonLdContext[];
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
     * A promise of the computed active context.
     */
    whenContext: Promise<JsonLdContextOpt>;

    /**
     * The ctor allows you to set/override the context on creation.
     * Please note that the context management logic runs only AFTER
     * your initialize method, if you define one.
     */
    constructor(attributes, options) {
        super(attributes, options);
        let newContext: JsonLdContextOpt = options.context;
        if (isDefined(newContext)) {
            this.set('@context', newContext);
        }
        this.on('change:@context', this.processContext, this);
        this.processContext();
    }

    /**
     * Compute the Graph-aware context for future use. See
     * https://w3c.github.io/json-ld-syntax/#advanced-context-usage
     */
    processContext(): Promise<JsonLdContextOpt> {
        let globalContext = this.collection && this.collection.whenContext;
        let localContext: JsonLdContextOpt = this.get('@context');
        let contextPromise: Promise<JsonLdContextOpt>;
        let setPromise = gC => processContext(gC, localContext);
        if (globalContext) {
            contextPromise = globalContext.then(setPromise);
        } else {
            contextPromise = setPromise(globalContext);
        }
        contextPromise.then(this.applyNewContext.bind(this));
        return this.whenContext = contextPromise;
    }

    private async applyNewContext(context?: JsonLdContext): Promise<this> {
        this.trigger('jsonld:context', this, context);
        let oldJson = this.toJSON();
        let localContext = this.get('@context');
        delete oldJson['@context'];  // let's not pass the context twice
        newJson = await compact(oldJson, context);
        // We pass silent: true because conceptually, the data didn't change;
        // they were just formatted differently.
        this.set(newJson, { silent: true });
        return this.trigger('jsonld:compact', this);
    }
}