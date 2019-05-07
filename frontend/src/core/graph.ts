import { extend, isUndefined, isArray, isEqual } from 'lodash';
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
        this.whenContext = this.computeContext(this.get('@context'));
        this.on('change:@context', this.processContext, this);
        let newContext: JsonLdContextOpt = options.context;
        if (isDefined(newContext)) {
            this.set('@context', newContext);
        }
    }

    /**
     * Compute the Graph-aware context without modifying this. See
     * https://w3c.github.io/json-ld-syntax/#advanced-context-usage
     */
    async computeContext(localContext: JsonLdContextOpt): Promise<JsonLdContextOpt> {
        let globalContext = this.collection && this.collection.whenContext;
        return processContext(await globalContext, localContext);
    }

    /**
     * Compute and process the Graph-aware context for future use. See
     * https://w3c.github.io/json-ld-syntax/#advanced-context-usage
     */
    processContext(): Promise<JsonLdContextOpt> {
        let localContext: JsonLdContextOpt = this.get('@context');
        let oldContext = this.whenContext;
        let contextPromise = this.computeContext(localContext);
        let consistentPromise = contextPromise.then(async newContext => {
            await this.applyNewContext(
                newContext,
                await oldContext,
                localContext,
            );
            return newContext;
        });
        return this.whenContext = consistentPromise;
    }

    private async applyNewContext(
        newContext: JsonLdContextOpt,
        expandContext: JsonLdContextOpt,
        localContext: JsonLdContextOpt,
    ): Promise<this> {
        if (isEqual(newContext, expandContext)) return this;
        this.trigger('jsonld:context', this, newContext, localContext);
        let oldJson = this.toJSON();
        delete oldJson['@context'];  // let's not pass the context twice
        newJson = await compact(oldJson, newContext, { expandContext });
        newJson['@context'] = localContext;
        // We pass silent: true because conceptually, the data didn't change;
        // they were just formatted differently.
        this.clear({ silent: true }).set(newJson, { silent: true });
        return this.trigger('jsonld:compact', this, newJson);
    }

    // TODO: non-modifying compact and flatten methods
}