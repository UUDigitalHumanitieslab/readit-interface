import { defaults, has, isUndefined, isString, isArray } from 'lodash';
import { channel } from 'backbone.radio';

import { proxyRoot } from 'config.json';

import { channelName } from './constants';
import { Identifier, FlatLdDocument, FlatLdGraph } from './json';
import Node from './node';
import Graph from './graph';

const fetchOptions = {
    remove: false,
    merge: true,
};

/**
 * Global graph that contains all Nodes ever fetched or created
 * during application runtime. Meant to be used as a singleton
 * instance.
 */
export default class Store extends Graph {
    private _additionQueue: Node[] = [];
    private _concurrentSet: number = 0;

    constructor(models?, options?) {
        super(models, options);
        this.forEach(this._preventSelfReference.bind(this));
        this.on('add', this._preventSelfReference);
        const ldChannel = channel(channelName);
        ldChannel.reply('obtain', this.obtain.bind(this));
        ldChannel.reply('merge', this.mergeExisting.bind(this));
        this.listenTo(ldChannel, 'register', this.register);
        this._forwardEventsToChannel([
            'request', 'sync', 'error', 'add',
        ]);
    }

    /**
     * Main interface. Ensures every @id is represented by a single unique Node.
     */
    obtain(id: string | Identifier | Node): Node {
        const initialResult = this.get(id as string | Node);
        if (isUndefined(initialResult)) {
            const placeholder = this.getPlaceholder(id);
            this.import(placeholder.id);
            return placeholder;
        }
        return initialResult;
    }

    /**
     * Create, store and return a placeholder for a missing Node.
     */
    getPlaceholder(id: string | Identifier | Node): Node {
        let placeholder;
        if (id instanceof Node) {
            placeholder = id;
        } else if (isString(id)) {
            placeholder = new Node({'@id': id});
        } else if (has(id, '@id')) {
            placeholder = new Node(id);
        } else {
            throw TypeError('id must be string, Identifier or Node');
        }
        this.add(placeholder);
        return placeholder;
    }

    /**
     * Fetch all triples related to a resource and update.
     */
    import(url: string): this {
        let xhr = this.fetch(defaults({url}, fetchOptions));
        // retry via proxy if the initial request fails
        xhr.catch(this.importViaProxy.bind(this, url));
        return this;
    }

    /**
     * Like import, but send the request through our own proxy.
     */
    importViaProxy(url: string): this {
        this.fetch(defaults({url: `${proxyRoot}${url}`}, fetchOptions));
        return this;
    }

    /**
     * Request handler that facilitates Graph.parse.
     */
    mergeExisting(id: Identifier): Identifier | Node {
        const initialResult = this.get(id as unknown as Node);
        if (isUndefined(initialResult)) return id;
        initialResult.set(id);
        return initialResult;
    }

    /**
     * Override Graph.parse in order to leave the meta Node unchanged
     * and skip the mergeExisting step.
     */
    parse(response: FlatLdDocument, options): FlatLdGraph {
        const [data] = this.preparse(response);
        return data;
    }

    /**
     * Register a newly constructed Node.
     */
    register(node: Node): this {
        if (node.id) {
            this._queueAddition(node);
        } else {
            node.once('change:@id', this._queueAddition.bind(this));
        }
        return this;
    }

    /**
     * Override the set method to prevent duplication and process
     * queued additions.
     */
    set(models, options): Node[] {
        ++this._concurrentSet;
        const result = super.set(models, options);
        if (this._concurrentSet === 1) {
            const extra = this._additionQueue;
            this._additionQueue = [];
            this.add(extra);
        }
        --this._concurrentSet;
        return result;
    }

    /**
     * Stop replying to the obtain request to facilitate garbage collection.
     */
    stopReplying(): this {
        channel(channelName).stopReplying('obtain');
        return this;
    }

    /**
     * Prevent stored Nodes from having their .collection set to this.
     */
    private _preventSelfReference(node: Node): void {
        if (node.collection === this) delete node.collection;
    }

    /**
     * Forward the named events unmodified to the ld channel.
     */
    private _forwardEventsToChannel(names: string[]): void {
        const ldChannel = channel(channelName);
        names.forEach(name => {
            this.on(name, (...args) => ldChannel.trigger(name, ...args));
        });
    }

    /**
     * Wrapper for .add to prevent duplicate nodes.
     */
    private _queueAddition(node: Node): void {
        if (this._concurrentSet) {
            this._additionQueue.push(node);
        } else {
            this.add(node);
        }
    }
}
