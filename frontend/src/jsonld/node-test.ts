import { Model } from 'backbone';

import { contentInstance } from '../mock-data/mock-expanded';
import { item, readit, staff, owl, dcterms, xsd } from './ns';
import * as conversionModule from './conversion';
import Node from './node';

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
    attrs: {
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
    },
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
});
