import {
    extend,
    map,
    mapValues,
    has,
    isUndefined,
    isArray,
    isEqual,
} from 'lodash';
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
    FlatLdObject,
    Identifier
} from './json';
import Graph from './graph';
import sync from './sync';
import {
    Native as OptimizedNative,
    NativeArray as OptimizedNativeArray,
    asNative,
    asLD,
} from './conversion';

type UnoptimizedNative = Exclude<OptimizedNative, Identifier | OptimizedNativeArray>;
export type Native = UnoptimizedNative | Node | NativeArray;
export interface NativeArray extends Array<Native> { }

/**
 * Representation of a single JSON-LD object with an @id.
 * Mostly for internal use, as the model type for Graph.
 */
export default class Node extends Model {
    /**
     * Original local context, if set. Access through this.context.
     */
    localContext: JsonLdContext;

    /**
     */

    collection: Graph;

    /**
     * The ctor allows you to set/override the context on creation.
     */
    constructor(attributes?: any, options?) {
        super(attributes, options);
        let context: JsonLdContext = options && options.context;
        if (!isUndefined(context)) this.context = context;
    }

    /**
     * Compute the Graph-aware context without modifying this. See
     * https://w3c.github.io/json-ld-syntax/#advanced-context-usage
     */
    get context(): JsonLdContext {
        let globalContext = this.collection && this.collection.context || [];
        if (!isArray(globalContext)) globalContext = [globalContext];
        let localContext = this.localContext;
        if (isUndefined(localContext)) localContext = [];
        let totalContext = globalContext.concat(localContext);
        if (totalContext.length === 0) return undefined;
        if (totalContext.length === 1) return totalContext[0];
        return totalContext;
    }

    /**
     * Set a local context for future compaction.
     */
    set context(newLocal: JsonLdContext) {
        if (isEqual(newLocal, this.localContext)) return;
        if (isUndefined(newLocal)) {
            delete this.localContext;
        } else {
            this.localContext = newLocal;
        }
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

    /**
     * Override the get method to convert identifiers to Nodes.
     */
    get<T extends string>(key: T): T extends '@id' ? string : NativeArray {
        const value = super.get(key);
        if (isArray(value) && key !== '@type') {
            return map(value, id2node.bind(this)) as T extends '@id' ? string : NativeArray;
        }
        return value;
    }

    /**
     * Override the toJSON method to convert native to JSON-LD.
     */
    toJSON(options?: any): FlatLdObject {
        return mapValues(this.attributes, asLDArray) as FlatLdObject;
    }

    // TODO: non-modifying compact and flatten methods
}

extend(Node.prototype, {
    idAttribute: '@id',
    sync,
});

/**
 * Implementation details of the Node class.
 */
function asNativeArray(value: any, key: string): OptimizedNative {
    if (key === '@id') return value;
    let array = isArray(value) ? value : [value];
    return map(array, asNative);
}

function id2node(value: OptimizedNative): Native {
    if (has(value, '@id')) {
        return this.collection && this.collection.get(value) || new Node(value);
    }
    if (isArray(value)) return map(value, id2node.bind(this));
    return value;
}

function asLDArray<K extends keyof FlatLdObject>(value: OptimizedNative, key: K): FlatLdObject[K] {
    if (key === '@id') return value as string;
    if (key === '@type') return value as string[];
    return map(value as OptimizedNativeArray, asLD);
}
