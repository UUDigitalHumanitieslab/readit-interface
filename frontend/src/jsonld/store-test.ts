import 'jasmine-ajax';

import { contentInstance } from '../mock-data/mock-expanded';
import compactData from '../mock-data/mock-compact';
import context from '../mock-data/mock-context';

import { readit } from './ns';
import Node from './node';
import Store from './store';

const uri = contentInstance['@id'];

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
});
