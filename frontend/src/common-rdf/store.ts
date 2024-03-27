import { defaults, isUndefined, isString, isArray } from 'lodash';
import { channel } from 'backbone.radio';

import { proxyRoot } from 'config.json';

import { channelName } from './constants';
import ldChannel from './radio';
import { Identifier, isIdentifier, FlatLdDocument, FlatLdGraph } from './json';
import Subject, { isSubject, SubjectLike } from './subject';
import Graph, { ReadOnlyGraph } from './graph';

export interface StoreVisitor<T> {
    (store: ReadOnlyGraph): T;
}

const fetchOptions = {
    remove: false,
    merge: true,
};

/**
 * Global graph that contains all Subjects ever fetched or created
 * during application runtime. Meant to be used as a singleton
 * instance.
 */
export default class Store extends Graph {
    private _additionQueue: Subject[] = [];
    private _concurrentSet: number = 0;

    constructor(models?, options?) {
        super(models, options);
        this.forEach(this._preventSelfReference.bind(this));
        this.on('add', this._preventSelfReference);
        ldChannel.reply('visit', this.accept.bind(this));
        ldChannel.reply('obtain', this.obtain.bind(this));
        ldChannel.reply('merge', this.mergeExisting.bind(this));
        this.listenTo(ldChannel, 'register', this.register);
        this._forwardEventsToChannel([
            'request', 'sync', 'error', 'add',
        ]);
    }

    /**
     * Generic interface for read-only access to the store contents.
     */
    accept<T>(visitor: StoreVisitor<T>): T {
        return visitor(this as ReadOnlyGraph);
    }

    /**
     * Main interface. Ensures every @id is represented by a single unique Subject.
     */
    obtain(id: SubjectLike): Subject {
        const initialResult = this.get(id as string | Subject);
        if (isUndefined(initialResult)) {
            const placeholder = this.getPlaceholder(id);
            this.import(placeholder.id as string);
            return placeholder;
        }
        return initialResult;
    }

    /**
     * Create, store and return a placeholder for a missing Subject.
     */
    getPlaceholder(id: SubjectLike): Subject {
        let placeholder;
        if (isSubject(id)) {
            placeholder = id;
        } else if (isString(id)) {
            placeholder = new Subject({'@id': id});
        } else if (isIdentifier(id)) {
            placeholder = new Subject(id);
        } else {
            throw TypeError('id must be string, Identifier or Subject');
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
     * Like import, but send the request through our own proxy or report 404.
     */
    importViaProxy(url: string, xhr?: JQuery.jqXHR): this {
        if (xhr && xhr.status === 404) {
            const notFoundResource = this.get(url);
            // The error event triggers on the store instead of on the
            // `notFoundResource`. Notify client code that is interested in this
            // particular resource.
            notFoundResource.trigger('error', notFoundResource, xhr, {});
            // We remove the resource for two reasons: (1) it doesn't exist so
            // there is no point in holding on to it and (2) if the same
            // resource is requested again later, the need to re-fetch it
            // ensures that the error will also be re-triggered.
            this.remove(notFoundResource);
        } else {
            this.fetch(defaults({
                url: `${proxyRoot}${encodeURIComponent(url)}`,
            }, fetchOptions));
        }
        return this;
    }

    /**
     * Request handler that facilitates Graph.parse.
     */
    mergeExisting(id: Identifier): Identifier | Subject {
        const initialResult = this.get(id as unknown as Subject);
        if (isUndefined(initialResult)) return id;
        initialResult.set(id);
        return initialResult;
    }

    /**
     * Override Graph.parse in order to leave the meta Subject unchanged
     * and skip the mergeExisting step.
     */
    parse(response: FlatLdDocument, options): FlatLdGraph {
        const [data] = this.preparse(response);
        return data;
    }

    /**
     * Register a newly constructed Subject.
     */
    register(subject: Subject): this {
        if (subject.id) {
            this._queueAddition(subject);
        } else {
            subject.once('change:@id', this._queueAddition.bind(this));
        }
        return this;
    }

    /**
     * Override the set method to prevent duplication and process
     * queued additions.
     */
    set(models, options): Subject[] {
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
     * Stop replying to requests to facilitate garbage collection.
     */
    stopReplying(): this {
        ldChannel.stopReplying('obtain');
        ldChannel.stopReplying('merge');
        return this;
    }

    /**
     * Prevent stored Subjects from having their .collection set to this.
     */
    private _preventSelfReference(subject: Subject): void {
        if (subject.collection === this) delete subject.collection;
    }

    /**
     * Forward the named events unmodified to the ld channel.
     */
    private _forwardEventsToChannel(names: string[]): void {
        names.forEach(name => {
            this.on(name, (...args) => ldChannel.trigger(name, ...args));
        });
    }

    /**
     * Wrapper for .add to prevent duplicate subjects.
     */
    private _queueAddition(subject: Subject): void {
        if (this._concurrentSet) {
            this._additionQueue.push(subject);
        } else {
            this.add(subject);
        }
    }
}
