import {
    extend,
    omit,
    forEach,
    map,
    every,
    isArray,
    isUndefined,
    isEmpty,
    isObjectLike,
    isString,
} from 'lodash';
import * as _ from 'lodash';

import Collection from '../core/collection';
import ldChannel from '../common-rdf/radio';
import {
    FlatLdDocument,
    FlatLdGraph,
    FlatLdObject,
    JsonLdContext,
} from './json';
import Subject from './subject';
import sync from './sync';

export default class Graph<T extends Subject = Subject> extends Collection<T> {
    /**
     * Information outside of the @graph, such as the global context.
     */
    meta: Subject;

    /**
     * Forward the meta context.
     */
    get context(): JsonLdContext {
        return this.meta.context;
    }
    set context(newGlobal: JsonLdContext) {
        this.meta.context = newGlobal;
    }

    preinitialize(models, options) {
        this.meta = new Subject();
        this.meta.on('change:@context', (model, newGlobal, oldGlobal) => {
            this.trigger('change:@context', this, newGlobal, oldGlobal);
        });
    }

    /**
     * The ctor allows you to set/override the context on creation.
     */
    constructor(models?, options?) {
        super(models, options);
        let context: JsonLdContext = options && options.context;
        if (!isUndefined(context)) this.context = context;
    }

    /**
     * Separate the graph proper from global attributes.
     */
    preparse(response: FlatLdDocument): [FlatLdGraph, FlatLdObject] {
        if (isArray(response)) {
            if (response.length !== 1) return [response, null];
            response = response[0];
            if (!response['@graph']) return [[response], null];
        }
        return [response['@graph'], omit(response, '@graph') as FlatLdObject];
    }

    /**
     * Set any metadata on the .meta node immediately. Return the rest.
     */
    parse(response: FlatLdDocument, options): FlatLdGraph {
        const [data, meta] = this.preparse(response);
        if (!isEmpty(meta)) {
            // TODO: clear properties on this.meta not in meta
            this.meta.set(meta);
        }
        return map(data, hash => ldChannel.request('merge', hash) || hash);
    }

    /**
     * TODO: override toJSON to include the data from this.meta
     */
}

const proto = Graph.prototype;

extend(proto, {
    model: Subject,
    sync,
});

export type ReadOnlyGraph = Omit<Graph,
    'preinitialize' | 'initialize' | 'sync' | 'add' | 'remove' | 'reset' |
    'set' | 'push' | 'pop' | 'unshift' | 'shift' | 'sort' | 'fetch' | 'create' |
    'context' | 'parse'
>;

export function isGraph(candidate: any): candidate is Graph {
    return candidate instanceof Graph;
}

/**
 * The next few functions and function call are implementation
 * details that enable JSON-LD array-aware model matching.
 */

function augmentedModelMatcher(attrs) {
    return model => every(attrs, (values, key) => {
        if (!isArray(values)) values = [values];
        return every(values, val => model.has(key, val));
    });
}

function augmentedPropertyMatcher(attrs) {
    return model => every(attrs, key => model.has(key));
}

function wrapIteratee(iteratee, instance) {
    if (isArray(iteratee)) return augmentedPropertyMatcher(iteratee);
    if (isObjectLike(iteratee) && !instance._isModel(iteratee)) {
        return augmentedModelMatcher(iteratee);
    }
    if (isString(iteratee)) return augmentedPropertyMatcher([iteratee]);
    return iteratee;
}

function rewrapMethod(length, method) {
    switch (length) {
    case 3: return function(iteratee, context?) {
        iteratee = wrapIteratee(iteratee, this);
        return _[method](this.models, iteratee, context);
    };
    case 4: return function(iteratee, defaultVal?, context?) {
        iteratee = wrapIteratee(iteratee, this);
        return _[method](this.models, iteratee, defaultVal, context);
    };
    default:
        throw new Error('This function is only meant for rewrapping methods that take an iteratee.');
    }
}

const methodsToRewrap = {
    forEach: 3, each: 3, map: 3, collect: 3, find: 3, detect: 3, filter: 3,
    select: 3, reject: 3, every: 3, all: 3, some: 3, any: 3, include: 3,
    includes: 3, contains: 3, max: 3, min: 3, first: 3, head: 3, take: 3,
    initial: 3, rest: 3, tail: 3, drop: 3, last: 3, indexOf: 3, lastIndexOf: 3,
    sample: 3, partition: 3, groupBy: 3, countBy: 3, sortBy: 3, indexBy: 3,
    findIndex: 3, findLastIndex: 3,
};

forEach(methodsToRewrap, function(length, method) {
    if (proto[method]) proto[method] = rewrapMethod(length, method);
});
