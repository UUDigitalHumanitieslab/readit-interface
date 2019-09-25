import { channel } from 'backbone.radio';

import mockItems, { anno1Instance } from '../mock-data/mock-items';
import { channelName } from './constants';
import { oa } from './ns';
import Graph from './graph';

const ldChannel = channel(channelName);

describe('Graph', function() {
    let graph;

    beforeEach(function() {
        graph = new Graph();
    });

    afterEach(function() {
        ldChannel.stopReplying();
    });

    describe('parse', function() {
        it('maps nodes through a merge request before returning', function() {
            const spy = jasmine.createSpy();
            ldChannel.reply('merge', spy);
            const result = graph.parse(mockItems, null);
            expect(result.length).toBe(mockItems.length);
            expect(spy.calls.count()).toBe(mockItems.length);
            spy.calls.all().forEach(({invocationOrder, args}: any) => {
                expect(args[0]).toBe(mockItems[invocationOrder]);
            });
        });
    });

    describe('underscore collection methods', function() {
        beforeEach(function() {
            graph.set(mockItems);
        });

        it('pass function iteratees unmodified', function() {
            expect(graph.filter(model => model.has(oa.hasBody)).length).toBe(3);
        });

        it('pass string iteratees to our JSON-LD aware wrapper', function() {
            expect(graph.filter(oa.hasBody).length).toBe(3);
        });

        it('pass hash iteratees to our JSON-LD aware wrapper', function() {
            expect(graph.filter({
                [oa.motivatedBy]: { '@id': oa.tagging },
            }).length).toBe(3);
            expect(graph.filter({
                [oa.motivatedBy]: [{ '@id': oa.tagging }],
            }).length).toBe(3);
        });

        it('pass array iteratees to our JSON-LD aware wrapper', function() {
            expect(graph.filter([oa.hasBody, oa.motivatedBy]).length).toBe(3);
        });

        it('pass node instances to the underlying algorithm', function() {
            const node = graph.get(anno1Instance);
            expect(graph.includes(node)).toBeTruthy();
        });
    });
});
