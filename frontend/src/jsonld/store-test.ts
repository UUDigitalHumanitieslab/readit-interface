import 'jasmine-ajax';

import { proxyRoot } from 'config.json';

import { contentInstance } from '../mock-data/mock-expanded';
import compactData from '../mock-data/mock-compact';
import context from '../mock-data/mock-context';

import { readit } from './ns';
import Node from './node';
import Graph from './graph';
import Store from './store';

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
            const added = this.store.request(partialHash);
            added.on('change', () => {
                expect(added.get('@type')).toEqual([readit('Content')]);
                done();
            });
            const request = jasmine.Ajax.requests.mostRecent();
            expect(request.url).toBe(uri);
            request.respondWith({
                status: 200,
                responseText: JSON.stringify(serverReply),
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

        it('attempts to fetch whatever uri is passed to it', function() {
            this.store.import(uri);
            const request = jasmine.Ajax.requests.mostRecent();
            expect(request.url).toBe(uri);
            expect(request.requestHeaders['Accept']).toBe('application/ld+json');
        });

        it('stores the response data internally if successful', function(done) {
            this.store.import(uri);
            jasmine.Ajax.requests.mostRecent().respondWith({
                status: 200,
                responseText: JSON.stringify(serverReply),
            });
            this.store.on('update', () => {
                expect(this.store.length).toBe(7);
                done();
            });
        });

        it('retries via proxy if the request fails', function(done) {
            this.store.importViaProxy.and.callFake(arg => {
                expect(arg).toBe(uri);
                done();
            });
            this.store.import(uri);
            jasmine.Ajax.requests.mostRecent().responseError();
        });
    });

    describe('importViaProxy', function() {
        it('attempts to fetch the passed uri via proxy', function() {
            this.store.importViaProxy(uri);
            const request = jasmine.Ajax.requests.mostRecent();
            expect(request.url).toBe(proxyUri);
            expect(request.requestHeaders['Accept']).toBe('application/ld+json');
        });

        it('stores the response data internally if successful', function(done) {
            this.store.importViaProxy(uri);
            jasmine.Ajax.requests.mostRecent().respondWith({
                status: 200,
                responseText: JSON.stringify(serverReply),
            });
            this.store.on('update', () => {
                expect(this.store.length).toBe(7);
                done();
            });
        });
    });
});
