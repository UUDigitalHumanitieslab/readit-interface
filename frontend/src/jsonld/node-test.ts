import { cloneDeep, get, set, initial } from 'lodash';
import { Model } from 'backbone';

import { contentInstance } from '../mock-data/mock-expanded';
import { item, readit, staff, owl, dcterms, xsd } from './ns';
import * as conversionModule from './conversion';
import Node from './node';

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

        it('leaves other attributes unmodified', function() {
            ['@id', '@type', dcterms.created, dcterms.title].forEach(key => {
                expect(this.node.get(key)).toEqual(contentInstanceNative[key]);
            });
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
    });
});
