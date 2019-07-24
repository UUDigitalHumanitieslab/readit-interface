import { extend, map, mapValues, isUndefined, isArray, isEqual } from 'lodash';
import {
    compact,  // (jsonld, ctx, options?, callback?) => Promise<jsonld>
    expand,   // (jsonld, options?, callback?) => Promise<jsonld>
    flatten,  // (jsonld, ctx, options?, callback?) => Promise<jsonld>
    processContext,  // (activeCtx, localCtx, options?, callback?) => Promise<ctx>
    fromRDF,  // (string, options?, callback?) => Promise<jsonld>
    toRDF,    // (jsonld, options?, callback?) => Promise<dataset>
    registerRDFParser,  // (contentType, parser) => void
} from 'jsonld';
import { ModelSetOptions } from 'backbone';

import Model from '../core/model';
import {
    JsonLdContext,
    ResolvedContext,
    JsonLdObject,
    FlatLdObject,
} from './json';
import Graph from './graph';
import sync from './sync';
import { Native, asNative } from './conversion';

/**
 * Representation of a single JSON-LD object with an @id.
 * Mostly for internal use, as the model type for Graph.
 */
export default class Node extends Model {
    /**
     * Original local context, if set.
     */
    localContext: JsonLdContext;

    /**
     * A promise of the computed active context.
     */
    whenContext: Promise<ResolvedContext>;

    collection: Graph;

    /**
     * The ctor allows you to set/override the context on creation.
     */
    constructor(attributes?: FlatLdObject, options?) {
        super(attributes, options);
        let context: JsonLdContext = options && options.context;
        if (!isUndefined(context)) this.setContext(context);
    }

    /**
     * Compute the Graph-aware context without modifying this. See
     * https://w3c.github.io/json-ld-syntax/#advanced-context-usage
     */
    async computeContext(localContext: JsonLdContext):Promise<ResolvedContext> {
        let globalContext = this.collection && this.collection.whenContext;
        return processContext(await globalContext, localContext || {});
    }

    /**
     * Set a local context for future compaction.
     */
    setContext(context: JsonLdContext): this {
        if (isEqual(context, this.localContext)) return this;
        if (isUndefined(context)) {
            delete this.localContext;
            delete this.whenContext;
        } else {
            this.localContext = context;
            this.whenContext = this.computeContext(context);
        }
        return this;
    }

    /**
     * Override the set method to convert JSON-LD to native.
     */
    set(key: string, value: any, options?: ModelSetOptions): this;
    set(hash: any, options?: ModelSetOptions): this;
    set(key, value?, options?) {
        let hash: any;
        if (typeof key === 'string') {
            hash = { [key]: value };
        } else {
            hash = key;
            options = value;
        }
        let normalizedHash = mapValues(hash, asNativeArray);
        return super.set(normalizedHash, options);
    }

    // TODO: non-modifying compact and flatten methods
}

extend(Node.prototype, {
    idAttribute: '@id',
    sync,
});

/**
 * Implementation detail of the Node class.
 */
function asNativeArray(value: any, key: string): Native {
    if (key === '@id') return value;
    let array = isArray(value) ? value : [value];
    return map(array, asNative);
}
