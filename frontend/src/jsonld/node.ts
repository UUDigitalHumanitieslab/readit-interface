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

import Model from '../core/model';
import Collection from '../core/collection';
import { JsonLdContext, JsonLdObject, ResolvedContext, JsonLdGraph } from './json';
import computeIdAlias from './idAlias';
import Graph from './graph';

function isDefined(arg: any): boolean {
    return !isUndefined(arg);
}

/**
 * Representation of a single JSON-LD object with an @id.
 * Mostly for internal use, as the model type for Graph.
 */
export default class Node extends Model {
    /**
     * attributes must be JSON-LD; this is a restriction from Model.
     */
    attributes: JsonLdObject;

    /**
     * A promise of the computed active context. Only resolves when
     * the attributes are consistent with the @context.
     */
    whenContext: Promise<ResolvedContext>;

    collection: Graph;

    /**
     * The ctor allows you to set/override the context on creation.
     * Please note that the context management logic runs only AFTER
     * your initialize method, if you define one.
     */
    constructor(attributes?, options?) {
        super(attributes, options);
        let id = this.id;
        this.whenContext = this.computeContext(this.get('@context')).then(
            context => this.updateIdAlias(context, id)
        );
        this.on('change:@context', this.processContext, this);
        let newContext: JsonLdContext = options.context;
        if (isDefined(newContext)) {
            this.set('@context', newContext);
        }
    }

    /**
     * Compute the Graph-aware context without modifying this. See
     * https://w3c.github.io/json-ld-syntax/#advanced-context-usage
     */
    async computeContext(localContext: JsonLdContext):Promise<ResolvedContext> {
        let globalContext = this.collection && this.collection.whenContext;
        return processContext(await globalContext, localContext);
    }

    /**
     * Compute and process the Graph-aware context for future use.
     * You shouldn't normally need to call this manually; wait for
     * this.whenContext to resolve instead. See
     * https://w3c.github.io/json-ld-syntax/#advanced-context-usage
     */
    processContext(): Promise<ResolvedContext> {
        let localContext: JsonLdContext = this.get('@context');
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
        newContext: ResolvedContext,
        expandContext: ResolvedContext,
        localContext: JsonLdContext,
    ): Promise<this> {
        if (isEqual(newContext, expandContext)) return this;
        this.trigger('jsonld:context', this, newContext, localContext);
        let oldJson = this.toJSON();
        let id = this.id;
        delete oldJson['@context'];  // let's not pass the context twice
        let newJson = await compact(oldJson, newContext, { expandContext });
        newJson['@context'] = localContext;
        // We pass silent: true because conceptually, the data didn't change;
        // they were just formatted differently.
        this.clear({ silent: true }).set(newJson, { silent: true });
        this.updateIdAlias(newContext, id);
        return this.trigger('jsonld:compact', this, newJson);
    }

    /**
     * Implementation detail.
     * @param context
     * @param id       A previously existing @id attribute, if set.
     * @return         The same `context` for promise chaining convenience.
     */
    private updateIdAlias(context: ResolvedContext, id: string):ResolvedContext{
        let alias = computeIdAlias(context);
        let eitherId = id || alias && this.get(alias);
        // if we already had an @id, then the following line is not a
        // change conceptually, so we don't emit a change event.
        if (eitherId) this.set(this.idAttribute, eitherId, { silent: !!id })
        // delete the alias to keep things consistent
        if (alias) this.unset(alias);
        return context;
    }

    // TODO: non-modifying compact and flatten methods
}

extend(Node.prototype, {
    idAttribute: '@id',
});
