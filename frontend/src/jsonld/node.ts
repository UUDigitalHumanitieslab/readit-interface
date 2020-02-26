import {
    extend,
    map,
    mapValues,
    filter,
    forEach,
    some,
    unionWith,
    differenceWith,
    has,
    result,
    isUndefined,
    isArray,
    isEqual,
    isNull,
    isBoolean,
    isNumber,
    isString,
    isPlainObject,
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
import { ModelSetOptions, Model as BackboneModel } from 'backbone';

import Model from '../core/model';

import ldChannel from './radio';
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
import { xsd } from './ns';

type UnoptimizedNative = Exclude<OptimizedNative, Identifier | OptimizedNativeArray>;
export type Native = UnoptimizedNative | Node | NativeArray;
export interface NativeArray extends Array<Native> { }

export interface NodeGetOptions {
    '@type'?: string;
}
export interface TypeFilter {
    (value: OptimizedNative): boolean;
}

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
     * Previous graph-aware context.
     * Only available inside change:@context handlers.
     */
    previousContext: JsonLdContext;

    collection: Graph;

    /**
     * The ctor allows you to set/override the context on creation.
     */
    constructor(attributes?: any, options?) {
        super(attributes, options);
        let context: JsonLdContext = options && options.context;
        if (!isUndefined(context)) this.context = context;
        ldChannel.trigger('register', this);
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
        let oldLocal = this.localContext;
        this.previousContext = this.context;
        if (isUndefined(newLocal)) {
            delete this.localContext;
        } else {
            this.localContext = newLocal;
        }
        this.trigger('change:@context', this, newLocal, oldLocal);
        delete this.previousContext;
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
        forEach(normalizedHash, (additions: OptimizedNativeArray, predicate) => {
            if (predicate === '@id') return;
            let existing = super.get(predicate);
            normalizedHash[predicate] = unionWith(existing, additions, isEqual);
        });
        return super.set(normalizedHash, options);
    }

    /**
     * Adapt the unset method to JSON-LD array semantics.
     */
    unset(key: string, value?: any, options?: ModelSetOptions): this {
        if (isUndefined(value)) return super.unset(key, options) as this;
        let existing = super.get(key);
        if (key === '@id') {
            if (value === existing) return super.unset(key, options) as this;
            return this;
        }
        let toRemove = asNativeArray(value, key) as OptimizedNativeArray;
        let remaining = differenceWith(existing, toRemove, isEqual);
        if (!remaining.length) return super.unset(key, options) as this;
        return super.set(key, remaining, options) as this;
    }

    /**
     * Override the get method to convert identifiers to Nodes.
     */
    get<T extends string>(
        key: T,
        options?: NodeGetOptions,
    ): T extends '@id' ? string : NativeArray {
        let value = super.get(key);
        if (isArray(value) && key !== '@type') {
            let type = options && options['@type'];
            if (!isUndefined(type)) value = filter(value, typeFilter(type));
            return map(value, id2node.bind(this)) as T extends '@id' ? string : NativeArray;
        }
        return value;
    }

    /**
     * Adapt the has method to JSON-LD array semantics.
     */
    has(predicate: string, object?: any): boolean {
        let candidates = super.get(predicate);
        if (!candidates) return false;
        if (isUndefined(object)) return candidates.length;
        if (candidates.length === 1 && isArray(candidates[0])) {
            // Special case. We consider the list of objects
            // associated with this subject-predicate pair to be
            // sorted, rather than considering one of the objects to
            // be a sorted list.
            candidates = candidates[0];
        }
        object = asNative(object);
        return some(candidates, c => isEqual(c, object));
    }

    /**
     * Override the toJSON method to convert native to JSON-LD.
     */
    toJSON(options?: any): FlatLdObject {
        return mapValues(this.attributes, asLDArray) as FlatLdObject;
    }

    /**
     * Override the parse method to unwrap singleton arrays.
     */
    parse(data: FlatLdObject | [FlatLdObject], options?: any): FlatLdObject {
        if (isPlainObject(data)) return data as FlatLdObject;
        if (isArray(data) && (data as [FlatLdObject]).length === 1) return data[0];
        throw TypeError('Object or singleton array expected.');
    }

    save(attributes: any = {}, options = {}) {
        if (attributes instanceof HTMLFormElement) {
            extend(options, {
                data: new FormData(attributes),
                cache: false,
                contentType: false
            });
            return super.save(null, options);
        }

        super.save(attributes, options);
    }
}

extend(Node.prototype, {
    idAttribute: '@id',
    sync,
    url(): string {
        if (this.id) return this.id;
        return BackboneModel.prototype.url.call(this);
    },
});

export type NodeLike = string | Identifier | Node;

export function isNode(candidate: any): candidate is Node {
    return candidate instanceof Node;
}

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
        return ldChannel.request('obtain', value) || new Node(value);
    }
    if (isArray(value)) return map(value, id2node.bind(this));
    return value;
}

function asLDArray<K extends keyof FlatLdObject>(value: OptimizedNative, key: K): FlatLdObject[K] {
    if (key === '@id') return value as string;
    if (key === '@type') return value as string[];
    return map(value as OptimizedNativeArray, asLD);
}

function typeFilter(typeName: string): TypeFilter {
    if (typeName === '@id') return value => has(value, '@id');
    if (typeName === null) return isNull;
    if (typeName === xsd.boolean) return isBoolean;
    if (typeName === xsd.integer || typeName === xsd.double) return isNumber;
    if (typeName === xsd.string) return isString;
    return value => value['@type'] === typeName;
}
