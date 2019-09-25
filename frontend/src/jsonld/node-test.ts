import { cloneDeep, get, set, initial, omit } from 'lodash';
import { Model } from 'backbone';
import { channel } from 'backbone.radio';
import { compact } from 'jsonld';

import {
    contentInstance,
    textPositionSelector as flatTextPositionSelector,
} from '../mock-data/mock-expanded';
import {
    textPositionSelector as compactTextPositionSelector,
} from '../mock-data/mock-compact';
import context from '../mock-data/mock-context';

import { channelName } from './constants';
import { item, readit, staff, owl, dcterms, xsd } from './ns';
import * as conversionModule from './conversion';
import Node from './node';

const ldChannel = channel(channelName);

const contentInstanceNative = {
    '@id': item('3'),
    '@type': [readit('Content')],
    [owl.sameAs]: [{ '@id': 'http://www.wikidata.org/entity/Q331656' }],
    [dcterms.creator]: [{ '@id': staff('JdeKruif') },],
    [dcterms.created]: [(function() {
        let d = new Date('2085-12-31T04:33:16+01:00');
        d['@type'] = xsd.dateTime;
        return d;
    }())],
    [dcterms.title]: ['Pretty Little Title'],
};

const contentInstanceJSON = (function() {
    let copy = cloneDeep(contentInstance);
    const path = [dcterms.created, 0, '@value'];
    set(copy, path, get(contentInstanceNative, initial(path)).toJSON());
    return copy;
}());

const expectedConversions = [{
    args: ['a', 1],
    attrs: { 'a': [1] },
}, {
    args: ['a', [1]],
    attrs: { 'a': [1] },
}, {
    args: ['a', [[1]]],
    attrs: { 'a': [[1]] },
}, {
    args: ['@id', '1'],
    attrs: { '@id': '1' },
}, {
    args: ['@type', '1'],
    attrs: { '@type': ['1'] },
}, {
    args: [{ 'a': 1 }],
    attrs: { 'a': [1] },
}, {
    args: ['a', { '@value': 1 }],
    attrs: { 'a': [1] },
}, {
    args: ['a', [{ '@value': 1 }]],
    attrs: { 'a': [1] },
}, {
    args: ['a', { '@id': '1' }],
    attrs: { 'a': [{ '@id': '1' }] },
}, {
    args: ['a', [{ '@id': '1' }]],
    attrs: { 'a': [{ '@id': '1' }] },
}, {
    args: ['a', { '@list': [1, 2, 3] }],
    attrs: { 'a': [[1, 2, 3]] },
}, {
    args: ['a', [{ '@list': [1, 2, 3] }]],
    attrs: { 'a': [[1, 2, 3]] },
}, {
    args: [contentInstance],
    attrs: contentInstanceNative,
}];

describe('Node', function() {
    beforeEach(function() {
        this.node = new Node();
    });

    it('triggers a register event on the ld channel', function() {
        const spy = jasmine.createSpy();
        ldChannel.on('register', spy);
        const dummy = new Node();
        expect(spy).toHaveBeenCalledWith(dummy);
        ldChannel.off('register', spy);
    });

    describe('set', function() {
        it('calls Backbone.Model.set internally', function() {
            spyOn(Model.prototype, 'set');
            this.node.set({});
            expect(Model.prototype.set).toHaveBeenCalled();
        });

        it('passes the options to Backbone.Model.set', function() {
            let spy1 = jasmine.createSpy('spy1');
            let spy2 = jasmine.createSpy('spy2');
            this.node.on('change', spy1);
            this.node.set('a', 1, { silent: true });
            expect(spy1).not.toHaveBeenCalled();
            this.node.set('a', 2);
            expect(spy1).toHaveBeenCalled();
            this.node.on('change', spy2);
            this.node.set({ 'a': 3 }, { silent: true });
            expect(spy2).not.toHaveBeenCalled();
            this.node.set({ 'a': 4 });
            expect(spy2).toHaveBeenCalled();
        });

        it('calls the asNative conversion function internally', function() {
            spyOn(conversionModule, 'asNative').and.callThrough();
            this.node.set('a', 1);
            expect(conversionModule.asNative).toHaveBeenCalled();
        });

        it('normalizes the arguments to arrays of native values', function() {
            expectedConversions.forEach(({args, attrs}) => {
                this.node.set.apply(this.node, args);
                expect(this.node.attributes).toEqual(attrs);
                if (attrs['@id']) {
                    expect(this.node.id).toBe(attrs['@id']);
                }
                this.node.clear();
            });
        });

        it('appends rather than replaces', function() {
            this.node.set('a', 1);
            this.node.set('a', 2);
            expect(this.node.get('a')).toEqual([1, 2]);
        });

        it('merges array arguments into the existing value(s)', function() {
            this.node.set('a', [1, 2, 3]);
            this.node.set('a', [2, 4, 5]);
            expect(this.node.get('a')).toEqual([1, 2, 3, 4, 5]);
        });
    });

    describe('unset', function() {
        it('can clear out an attribute', function() {
            this.node.set('a', 1);
            this.node.unset('a');
            expect(this.node.has('a')).toBeFalsy();
        });

        it('can remove just select triples', function() {
            this.node.set('a', [1, 2, 3, 4, 5]);
            this.node.unset('a', [2, 5, 7]);
            expect(this.node.get('a')).toEqual([1, 3, 4]);
        });
    });

    describe('get', function() {
        beforeEach(function() {
            this.node.set(contentInstance);
        });

        it('converts Identifiers to Nodes', function() {
            [owl.sameAs, dcterms.creator].forEach(key => {
                const value = this.node.get(key)[0];
                expect(value).toEqual(jasmine.any(Node));
                expect(value).toEqual(jasmine.objectContaining({
                    id: contentInstanceNative[key][0]['@id'],
                }));
            });
        });

        it('requests Identifiers from the ld channel first', function() {
            const dummy = new Node();
            ldChannel.reply('obtain', () => dummy);
            const result = this.node.get(owl.sameAs)[0];
            expect(result).toBe(dummy);
        });

        it('leaves other attributes unmodified', function() {
            ['@id', '@type', dcterms.created, dcterms.title].forEach(key => {
                expect(this.node.get(key)).toEqual(contentInstanceNative[key]);
            });
        });

        it('can optionally filter by type', function() {
            let expectFilteredMatch = (attribute, type, length) => {
                const value = this.node.get(attribute, { '@type': type });
                expect(value.length).toBe(length);
                // The following works as a special case because the mock item
                // happens to contain only arrays of length 1.
                if (length === 1) {
                    if (type === '@id') {
                        expect(value[0].id)
                            .toBe(this.node.get(attribute)[0].id);
                    } else{
                        expect(value).toEqual(this.node.get(attribute));
                    }
                }
            };
            expectFilteredMatch(owl.sameAs, '@id', 1);
            expectFilteredMatch(owl.sameAs, xsd.integer, 0);
            expectFilteredMatch(dcterms.created, xsd.dateTime, 1);
            expectFilteredMatch(dcterms.created, null, 0);
            expectFilteredMatch(dcterms.title, xsd.string, 1);
            expectFilteredMatch(dcterms.title, '@id', 0);
        });
    });

    describe('has', function() {
        const node = new Node({
            '@type': [],
            [dcterms.creator]: [{
                '@id': staff('JdeKruif'),
            }, {
                '@id': staff('AHebing'),
            }],
            [dcterms.created]: [{
                '@value': '2085-12-31T03:33:16.000Z',
                '@type': xsd.dateTime,
            }],
        });

        it('finds a property', function() {
            expect(node.has(dcterms.creator)).toBeTruthy();
            expect(node.has(dcterms.created)).toBeTruthy();
        });

        it('ignores empty values', function() {
            expect(node.has('@type')).toBeFalsy();
            expect(node.has(dcterms.title)).toBeFalsy();
        });

        it('can check for specific predicate-object pairs', function() {
            expect(node.has(dcterms.creator, {
                '@id': staff('AHebing'),
            })).toBeTruthy();
            expect(node.has(dcterms.creator, {
                '@id': staff('JGonggrijp'),
            })).toBeFalsy();
            let aDate = new Date('2085-12-31T03:33:16.000Z');
            aDate['@type'] = xsd.dateTime;
            expect(node.has(dcterms.created, aDate)).toBeTruthy();
            expect(node.has('@type', 'x')).toBeFalsy();
            expect(node.has(dcterms.title, {'@value': 'x'})).toBeFalsy();
        });
    });

    describe('toJSON', function() {
        it('calls the asLD conversion function internally', function() {
            spyOn(conversionModule, 'asLD').and.callThrough();
            this.node.set('a', 1);
            expect(conversionModule.asLD).not.toHaveBeenCalled();
            const result = this.node.toJSON();
            expect(conversionModule.asLD).toHaveBeenCalled();
            expect(result).toEqual({ 'a': [{ '@value': 1 }] });
        });

        it('returns the Node\'s attributes in expanded JSON-LD', function() {
            this.node.set(contentInstance);
            expect(this.node.toJSON()).toEqual(contentInstanceJSON);
        });

        it('makes a perfect round trip after compaction', async function() {
            this.node.set(flatTextPositionSelector);
            let json = this.node.toJSON();
            expect(json).toEqual(flatTextPositionSelector);
            let compacted = omit(await compact(json, context), '@context');
            expect(compacted).toEqual(compactTextPositionSelector);
        });
    });
});
