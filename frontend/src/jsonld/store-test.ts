import 'jasmine-ajax';

import { channel } from 'backbone.radio';

import { proxyRoot } from 'config.json';

import { contentInstance } from '../mock-data/mock-expanded';
import compactData from '../mock-data/mock-compact';
import context from '../mock-data/mock-context';

import { channelName } from './constants';
import { readit } from './ns';
import Node from './node';
import Graph from './graph';
import Store from './store';

const ldChannel = channel(channelName);

const uri = contentInstance['@id'];
const proxyUri = `${proxyRoot}${uri}`;

const partialHash = {
    '@id': uri,
};

const fullHash = contentInstance;

const otherHash = {
    '@id': 'http://testing.test/2',
};

const serverReply = {'@context': context, '@graph': compactData};

describe('Store', function() {
    beforeEach(function() {
        jasmine.Ajax.install();
        this.store = new Store([otherHash]);
    });

    afterEach(function() {
        jasmine.Ajax.uninstall();
        this.store.off().stopListening().stopReplying();
        delete this.store;
    });

    it('does not set the .collection of stored Nodes', function() {
        const stored = this.store.at(0);
        expect(stored.collection).toBeUndefined();
    });

    it('leaves an existing .collection unchanged', function() {
        const otherCollection = new Graph([partialHash]);
        const stored = otherCollection.at(0);
        this.store.add(otherCollection.models);
        expect(stored.collection).toBe(otherCollection);
    });

    it('allows other Graphs to set the .collection later', function() {
        const otherCollection = new Graph();
        const stored = this.store.at(0);
        otherCollection.add(stored);
        expect(stored.collection).toBe(otherCollection);
    });

    describe('channel bindings ensure that...', function() {
        it('"seek" is replied to with the request method', function() {
            const result = ldChannel.request('seek', partialHash);
            expect(result).toEqual(jasmine.any(Node));
            expect(result.id).toBe(uri);
            expect(this.store.has(result)).toBeTruthy();
        });

        it('"register" is handled by the register method', function() {
            const dummy = new Node(partialHash);
            this.store.remove(dummy);
            ldChannel.trigger('register', dummy);
            expect(this.store.has(dummy)).toBeTruthy();
        });

        it('key events from the store are mirrored on the channel', function() {
            ['request', 'sync', 'error', 'add'].forEach(e => {
                const spy = jasmine.createSpy(e);
                ldChannel.on(e, spy);
                this.store.trigger(e, {});
                expect(spy).toHaveBeenCalled();
                ldChannel.off(e, spy);
            });
        });
    });

    describe('stopReplying', function() {
        it('stops the store from replying to "seek"', function() {
            this.store.stopReplying();
            const result = ldChannel.request('seek', partialHash);
            expect(result).toBeUndefined();
            expect(this.store.has(partialHash)).toBeFalsy();
        });
    });

    describe('request', function() {
        beforeEach(function() {
            this.existing = this.store.at(0);
        });

        it('returns the existing Node for a known @id', function() {
            expect(this.store.request(otherHash['@id'])).toBe(this.existing);
        });

        it('returns the existing Node for a known hash', function() {
            expect(this.store.request(otherHash)).toBe(this.existing);
        });

        it('returns the existing Node for a known Node', function() {
            expect(this.store.request(this.existing)).toBe(this.existing);
        });

        it('returns a new Node for an unknown @id', function() {
            const added = this.store.request(uri);
            expect(added).toEqual(jasmine.any(Node))
            expect(added.id).toBe(uri);
        });

        it('returns a new Node for an unknown hash', function() {
            const added = this.store.request(partialHash);
            expect(added).toEqual(jasmine.any(Node))
            expect(added.id).toBe(uri);
        });

        it('returns the same Node for an unknown Node', function() {
            const added = new Node(partialHash);
            this.store.remove(added);
            const obtained = this.store.request(added);
            expect(obtained).toBe(added);
        });

        it('updates the returned Node with additional data', function(done) {
            jasmine.Ajax.stubRequest(uri).andReturn({
                status: 200,
                contentType: 'application/ld+json',
                responseText: JSON.stringify(serverReply),
            });
            const added = this.store.request(partialHash);
            added.on('change', () => {
                expect(added.get('@type')).toEqual([readit('Content')]);
                done();
            });
        });
    });

    describe('getPlaceholder', function() {
        it('stores and returns a Node for any given id', function() {
            const result = this.store.getPlaceholder(uri);
            expect(result).toEqual(jasmine.any(Node));
            expect(result.id).toBe(uri);
            expect(this.store.has(result)).toBeTruthy();
        });

        it('stores and returns a Node for any given hash', function() {
            const result = this.store.getPlaceholder(partialHash);
            expect(result).toEqual(jasmine.any(Node));
            expect(result.id).toBe(uri);
            expect(this.store.has(result)).toBeTruthy();
        });

        it('stores and returns any given Node', function() {
            const prepared = new Node(partialHash);
            this.store.remove(prepared);
            const result = this.store.getPlaceholder(prepared);
            expect(result).toBe(prepared);
            expect(result.id).toBe(uri);
            expect(this.store.has(result)).toBeTruthy();
        });
    });

    describe('import', function() {
        beforeEach(function() {
            spyOn(this.store, 'importViaProxy');
        });

        it('attempts to fetch whatever uri is passed to it', function(done) {
            spyOn(this.store, 'fetch').and.callThrough();
            jasmine.Ajax.stubRequest(uri).andCallFunction(xhr => {
                expect(this.store.fetch).toHaveBeenCalled();
                done();
            });
            this.store.import(uri);
        });

        it('stores the response data internally if successful', function(done) {
            jasmine.Ajax.stubRequest(uri).andReturn({
                status: 200,
                contentType: 'application/ld+json',
                responseText: JSON.stringify(serverReply),
            });
            this.store.import(uri);
            this.store.on('sync', () => {
                expect(this.store.length).toBe(7);
                done();
            });
        });

        it('retries via proxy if the request fails', function(done) {
            jasmine.Ajax.stubRequest(uri).andError({});
            this.store.importViaProxy.and.callFake(arg => {
                expect(arg).toBe(uri);
                done();
            });
            this.store.import(uri);
        });
    });

    describe('importViaProxy', function() {
        it('attempts to fetch the passed uri via proxy', function(done) {
            spyOn(this.store, 'fetch').and.callThrough();
            jasmine.Ajax.stubRequest(proxyUri).andCallFunction(xhr => {
                expect(this.store.fetch).toHaveBeenCalled();
                done();
            });
            this.store.importViaProxy(uri);
        });

        it('stores the response data internally if successful', function(done) {
            jasmine.Ajax.stubRequest(proxyUri).andReturn({
                status: 200,
                contentType: 'application/ld+json',
                responseText: JSON.stringify(serverReply),
            });
            this.store.importViaProxy(uri);
            this.store.on('sync', () => {
                expect(this.store.length).toBe(7);
                done();
            });
        });
    });

    describe('register', function() {
        it('stores the given node', function() {
            const node = new Node(partialHash);
            this.store.remove(node);
            this.store.register(node);
            expect(this.store.has(node)).toBeTruthy();
        });

        it('postpones storing if the node has no id yet', function() {
            const node = new Node();
            node.off('change:@id');
            this.store.register(node);
            expect(this.store.has(node)).toBeFalsy();
            node.set('@id', uri);
            expect(this.store.has(node)).toBeTruthy();
        });
    });
});
