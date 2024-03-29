import 'jasmine-ajax';
import { defaults } from 'lodash';

import { proxyRoot } from 'config.json';

import { contentInstance } from '../mock-data/mock-expanded';
import compactData from '../mock-data/mock-compact';
import context from '../mock-data/mock-context';

import ldChannel from './radio';
import { readit } from './ns';
import Subject from './subject';
import Graph from './graph';
import Store from './store';

const uri = contentInstance['@id'];
const proxyUri = `${proxyRoot}${encodeURIComponent(uri)}`;

const partialHash = {
    '@id': uri,
};

const fullHash = contentInstance;

const otherHash = {
    '@id': 'http://testing.test/2',
};

const serverReply = {'@context': context, '@graph': compactData};

function waitUntilRequest(store, done) {
    store.once('request', () => done());
}

function trivialVisitor(store) {
    return store.length;
}

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

    it('does not set the .collection of stored Subjects', function() {
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
        it('"visit" is replied to with the accept method', function() {
            const result = ldChannel.request('visit', trivialVisitor);
            expect(result).toBe(1);
        });

        it('"obtain" is replied to with the obtain method', function(done) {
            const result = ldChannel.request('obtain', partialHash);
            expect(result).toEqual(jasmine.any(Subject));
            expect(result.id).toBe(uri);
            expect(this.store.has(result)).toBeTruthy();
            waitUntilRequest(this.store, done);
        });

        it('"merge" is replied to with the mergeExisting method', function() {
            const stored = this.store.at(0);
            const result1 = ldChannel.request('merge', partialHash);
            const result2 = ldChannel.request('merge', otherHash);
            expect(result1).toBe(partialHash);
            expect(this.store.has(result1)).toBeFalsy();
            expect(result2).toBe(stored);
            expect(this.store.has(result2)).toBeTruthy();
        });

        it('"register" is handled by the register method', function() {
            const dummy = new Subject(partialHash);
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
        it('stops the store from replying to "obtain"', function() {
            this.store.stopReplying();
            const result = ldChannel.request('obtain', partialHash);
            expect(result).toBeUndefined();
            expect(this.store.has(partialHash)).toBeFalsy();
        });
    });

    describe('accept', function() {
        it('invokes the passed function with the store', function() {
            const spy = jasmine.createSpy();
            this.store.accept(spy);
            expect(spy).toHaveBeenCalledWith(this.store);
        });

        it('returns whatever the passed function returns', function() {
            const spy = jasmine.createSpy().and.returnValue('banana');
            expect(this.store.accept(spy)).toBe('banana');
        });
    });

    describe('obtain', function() {
        beforeEach(function() {
            this.existing = this.store.at(0);
        });

        it('returns the existing Subject for a known @id', function() {
            expect(this.store.obtain(otherHash['@id'])).toBe(this.existing);
        });

        it('returns the existing Subject for a known hash', function() {
            expect(this.store.obtain(otherHash)).toBe(this.existing);
        });

        it('returns the existing Subject for a known Subject', function() {
            expect(this.store.obtain(this.existing)).toBe(this.existing);
        });

        it('returns a new Subject for an unknown @id', function(done) {
            const added = this.store.obtain(uri);
            expect(added).toEqual(jasmine.any(Subject))
            expect(added.id).toBe(uri);
            waitUntilRequest(this.store, done);
        });

        it('returns a new Subject for an unknown hash', function(done) {
            const added = this.store.obtain(partialHash);
            expect(added).toEqual(jasmine.any(Subject))
            expect(added.id).toBe(uri);
            waitUntilRequest(this.store, done);
        });

        it('returns the same Subject for an unknown Subject', function(done) {
            const added = new Subject(partialHash);
            this.store.remove(added);
            const obtained = this.store.obtain(added);
            expect(obtained).toBe(added);
            waitUntilRequest(this.store, done);
        });

        it('updates the returned Subject with additional data', function(done) {
            jasmine.Ajax.stubRequest(uri).andReturn({
                status: 200,
                contentType: 'application/ld+json',
                responseText: JSON.stringify(serverReply),
            });
            const added = this.store.obtain(partialHash);
            added.on('change', () => {
                expect(added.get('@type')).toEqual([readit('Content')]);
                done();
            });
        });
    });

    describe('getPlaceholder', function() {
        it('stores and returns a Subject for any given id', function() {
            const result = this.store.getPlaceholder(uri);
            expect(result).toEqual(jasmine.any(Subject));
            expect(result.id).toBe(uri);
            expect(this.store.has(result)).toBeTruthy();
        });

        it('stores and returns a Subject for any given hash', function() {
            const result = this.store.getPlaceholder(partialHash);
            expect(result).toEqual(jasmine.any(Subject));
            expect(result.id).toBe(uri);
            expect(this.store.has(result)).toBeTruthy();
        });

        it('stores and returns any given Subject', function() {
            const prepared = new Subject(partialHash);
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

    describe('mergeExisting', function() {
        it('returns existing subjects', function() {
            const stored = this.store.at(0);
            const result = this.store.mergeExisting(otherHash);
            expect(result).toBe(stored);
        });

        it('merges passed properties into the existing subject', function() {
            const stored = this.store.at(0);
            const hash = defaults({prop: 'value'}, otherHash);
            const result = this.store.mergeExisting(hash);
            expect(result).toBe(stored);
            expect(result.id).toBe(otherHash['@id']);
            expect(result.get('prop')[0]).toBe('value');
        });

        it('returns the argument if no subject exists to merge with', function() {
            const result = this.store.mergeExisting(partialHash);
            expect(result).toBe(partialHash);
        });
    });

    describe('register', function() {
        it('stores the given subject', function() {
            const subject = new Subject(partialHash);
            this.store.remove(subject);
            this.store.register(subject);
            expect(this.store.has(subject)).toBeTruthy();
        });

        it('postpones storing if the subject has no id yet', function() {
            const subject = new Subject();
            subject.off('change:@id');
            this.store.register(subject);
            expect(this.store.has(subject)).toBeFalsy();
            subject.set('@id', uri);
            expect(this.store.has(subject)).toBeTruthy();
        });
    });
});
