import { cloneDeep, get, set, initial, omit, map } from 'lodash';
import { Model } from 'backbone';
import { compact } from 'jsonld';

import { event } from '../test-util';
import {
    contentInstance,
    textPositionSelector as flatTextPositionSelector,
} from '../mock-data/mock-expanded';
import {
    textPositionSelector as compactTextPositionSelector,
} from '../mock-data/mock-compact';
import context from '../mock-data/mock-context';

import ldChannel from './radio';
import { item, readit, staff, owl, dcterms, xsd, skos, oa } from './ns';
import * as conversionModule from './conversion';
import Subject from './subject';

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

describe('Subject', function() {
    beforeEach(function() {
        this.subject = new Subject();
    });

    it('triggers a register event on the ld channel', function() {
        const spy = jasmine.createSpy();
        ldChannel.on('register', spy);
        const dummy = new Subject();
        expect(spy).toHaveBeenCalledWith(dummy);
        ldChannel.off('register', spy);
    });

    describe('set', function() {
        it('calls Backbone.Model.set internally', function() {
            spyOn(Model.prototype, 'set');
            this.subject.set({});
            expect(Model.prototype.set).toHaveBeenCalled();
        });

        it('passes the options to Backbone.Model.set', function() {
            let spy1 = jasmine.createSpy('spy1');
            let spy2 = jasmine.createSpy('spy2');
            this.subject.on('change', spy1);
            this.subject.set('a', 1, { silent: true });
            expect(spy1).not.toHaveBeenCalled();
            this.subject.set('a', 2);
            expect(spy1).toHaveBeenCalled();
            this.subject.on('change', spy2);
            this.subject.set({ 'a': 3 }, { silent: true });
            expect(spy2).not.toHaveBeenCalled();
            this.subject.set({ 'a': 4 });
            expect(spy2).toHaveBeenCalled();
        });

        it('calls the asNative conversion function internally', function() {
            spyOn(conversionModule, 'asNative').and.callThrough();
            this.subject.set('a', 1);
            expect(conversionModule.asNative).toHaveBeenCalled();
        });

        it('normalizes the arguments to arrays of native values', function() {
            expectedConversions.forEach(({args, attrs}) => {
                this.subject.set.apply(this.subject, args);
                expect(this.subject.attributes).toEqual(attrs);
                if (attrs['@id']) {
                    expect(this.subject.id).toBe(attrs['@id']);
                }
                this.subject.clear();
            });
        });

        it('appends rather than replaces', function() {
            this.subject.set('a', 1);
            this.subject.set('a', 2);
            expect(this.subject.get('a')).toEqual([1, 2]);
        });

        it('merges array arguments into the existing value(s)', function() {
            this.subject.set('a', [1, 2, 3]);
            this.subject.set('a', [2, 4, 5]);
            expect(this.subject.get('a')).toEqual([1, 2, 3, 4, 5]);
        });
    });

    describe('unset', function() {
        it('can clear out an attribute', function() {
            this.subject.set('a', 1);
            this.subject.unset('a');
            expect(this.subject.has('a')).toBeFalsy();
        });

        it('can remove just select triples', function() {
            this.subject.set('a', [1, 2, 3, 4, 5]);
            this.subject.unset('a', [2, 5, 7]);
            expect(this.subject.get('a')).toEqual([1, 3, 4]);
        });

        it('triggers a change event', function() {
            this.subject.set('a', [1, 2, 3, 4, 5]);
            const spy = jasmine.createSpy();
            this.subject.on('change', spy);
            expect(spy).not.toHaveBeenCalled();
            this.subject.unset('a', [2, 5, 7]);
            expect(spy).toHaveBeenCalledTimes(1);
            this.subject.unset('a');
            expect(spy).toHaveBeenCalledTimes(2);
        });
    });

    describe('get', function() {
        beforeEach(function() {
            this.subject.set(contentInstance);
        });

        it('converts Identifiers to Subjects', function() {
            [owl.sameAs, dcterms.creator].forEach(key => {
                const value = this.subject.get(key)[0];
                expect(value).toEqual(jasmine.any(Subject));
                expect(value).toEqual(jasmine.objectContaining({
                    id: contentInstanceNative[key][0]['@id'],
                }));
            });
        });

        it('requests Identifiers from the ld channel first', function() {
            const dummy = new Subject();
            ldChannel.reply('obtain', () => dummy);
            const result = this.subject.get(owl.sameAs)[0];
            expect(result).toBe(dummy);
            ldChannel.stopReplying('obtain');
        });

        it('leaves other attributes unmodified', function() {
            ['@id', '@type', dcterms.created, dcterms.title].forEach(key => {
                expect(this.subject.get(key)).toEqual(contentInstanceNative[key]);
            });
        });

        it('can optionally filter by type', function() {
            let expectFilteredMatch = (attribute, type, length) => {
                const value = this.subject.get(attribute, { '@type': type });
                expect(value.length).toBe(length);
                // The following works as a special case because the mock item
                // happens to contain only arrays of length 1.
                if (length === 1) {
                    if (type === '@id') {
                        expect(value[0].id)
                            .toBe(this.subject.get(attribute)[0].id);
                    } else{
                        expect(value).toEqual(this.subject.get(attribute));
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

        it('can alternatively order by preferred language', function() {
            const values = [
                100,
                { '@value': 'Sinaasappel', '@language': 'nl' },
                'Orange',
                { '@value': 'Portakal', '@language': 'tr' },
            ];
            const native = map(values, conversionModule.asNative);
            const subject = new Subject({ [skos.prefLabel]: values });
            expect(subject.get(skos.prefLabel)).toEqual(native);
            expect(subject.get(skos.prefLabel, { '@type': xsd.string }))
                .toEqual([ native[1], native[2], native[3] ]);
            expect(subject.get(skos.prefLabel, { '@language': 'nl' }))
                .toEqual([ native[1], native[2], native[3] ]);
            expect(subject.get(skos.prefLabel, { '@language': 'tr' }))
                .toEqual([ native[3], native[2], native[1] ]);
            expect(subject.get(skos.prefLabel, { '@language': 'en' }))
                .toEqual([ native[2], native[1], native[3] ]);
            expect(subject.get(skos.prefLabel, { '@language': ['tr', 'nl'] }))
                .toEqual([ native[3], native[1], native[2] ]);
            expect(subject.get(skos.prefLabel, { '@language': ['nl', 'tr'] }))
                .toEqual([ native[1], native[3], native[2] ]);
        });
    });

    describe('has', function() {
        const subject = new Subject({
            '@type': ['y'],
            [dcterms.creator]: [{
                '@id': staff('JdeKruif'),
            }, {
                '@id': staff('AHebing'),
            }],
            [dcterms.created]: [{
                '@value': '2085-12-31T03:33:16.000Z',
                '@type': xsd.dateTime,
            }],
            [dcterms.coverage]: [],
        });

        it('finds a property', function() {
            expect(subject.has(dcterms.creator)).toBeTruthy();
            expect(subject.has(dcterms.created)).toBeTruthy();
        });

        it('ignores empty values', function() {
            expect(subject.has(dcterms.coverage)).toBeFalsy();
            expect(subject.has(dcterms.title)).toBeFalsy();
        });

        it('can check for specific predicate-object pairs', function() {
            expect(subject.has(dcterms.creator, {
                '@id': staff('AHebing'),
            })).toBeTruthy();
            expect(subject.has(dcterms.creator, {
                '@id': staff('JGonggrijp'),
            })).toBeFalsy();
            let aDate = new Date('2085-12-31T03:33:16.000Z');
            aDate['@type'] = xsd.dateTime;
            expect(subject.has(dcterms.created, aDate)).toBeTruthy();
            expect(subject.has('@type', 'x')).toBeFalsy();
            expect(subject.has('@type', 'y')).toBeTruthy();
            expect(subject.has(dcterms.title, {'@value': 'x'})).toBeFalsy();
        });
    });

    describe('toJSON', function() {
        it('calls the asLD conversion function internally', function() {
            spyOn(conversionModule, 'asLD').and.callThrough();
            this.subject.set('a', 1);
            expect(conversionModule.asLD).not.toHaveBeenCalled();
            const result = this.subject.toJSON();
            expect(conversionModule.asLD).toHaveBeenCalled();
            expect(result).toEqual({ 'a': [{ '@value': 1 }] });
        });

        it('returns the Subject\'s attributes in expanded JSON-LD', function() {
            this.subject.set(contentInstance);
            expect(this.subject.toJSON()).toEqual(contentInstanceJSON);
        });

        it('makes a perfect round trip after compaction', async function() {
            this.subject.set(flatTextPositionSelector);
            let json = this.subject.toJSON();
            expect(json).toEqual(flatTextPositionSelector);
            let compacted = omit(await compact(json, context), '@context');
            expect(compacted).toEqual(compactTextPositionSelector);
        });
    });

    describe('parse', function() {
        it('returns a single object unmodified', function() {
            const backup = cloneDeep(contentInstance);
            expect(this.subject.parse(contentInstance)).toBe(contentInstance);
            expect(contentInstance).toEqual(backup);
        });

        it('unwraps a singleton array', function() {
            const backup = cloneDeep(contentInstance);
            expect(this.subject.parse([contentInstance])).toBe(contentInstance);
            expect(contentInstance).toEqual(backup);
        });

        it('throws otherwise', function() {
            const buggies = [
                () => this.subject.parse([]),
                () => this.subject.parse([contentInstance, {}]),
                () => this.subject.parse([{}, {}, {}, {}, {}]),
            ];
            buggies.forEach(buggy => expect(buggy).toThrow());
        });
    });

    describe('save', function() {
        it('substitutes rather than merges attributes returned by the server', async function() {
            const url = 'http://localhost/test/test';
            const attributesBefore = {
                '@id': url,
                [oa.start]: {
                    '@type': xsd.decimal,
                    '@value': '4',
                },
            };
            const attributesAfter = {
                '@id': url,
                [oa.start]: {
                    '@type': xsd.decimal,
                    '@value': '4.0',
                },
            };
            const stringWrapper = Object(attributesAfter[oa.start]['@value']);
            stringWrapper['@type'] = attributesAfter[oa.start]['@type'];
            const attributesAfterNative = {
                '@id': url,
                [oa.start]: [stringWrapper],
            };
            const response = {
                status: 200,
                contentType: 'application/ld+json',
                responseText: JSON.stringify(attributesAfter),
            };
            jasmine.Ajax.install();
            jasmine.Ajax.stubRequest(url).andReturn(response);
            this.subject.set(attributesBefore);
            await this.subject.save();
            expect(this.subject.attributes).toEqual(attributesAfterNative);
            this.subject.unset(oa.start);
            await this.subject.save(attributesBefore);
            expect(this.subject.attributes).toEqual(attributesAfterNative);
            jasmine.Ajax.uninstall();
        });
    });
});
