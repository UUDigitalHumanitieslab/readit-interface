import mockItems, { anno1Instance } from '../mock-data/mock-items';
import ldChannel from '../common-rdf/radio';
import { oa } from './ns';
import Graph from './graph';


describe('Graph', function() {
    let graph;

    beforeEach(function() {
        graph = new Graph();
    });

    afterEach(function() {
        ldChannel.stopReplying();
    });

    describe('parse', function() {
        it('maps subjects through a merge request before returning', function() {
            const spy = jasmine.createSpy();
            ldChannel.reply('merge', spy);
            const result = graph.parse(mockItems, null);
            expect(result.length).toBe(mockItems.length);
            expect(spy.calls.count()).toBe(mockItems.length);
            spy.calls.all().forEach(({args}, index) => {
                expect(args[0]).toBe(mockItems[index]);
            });
        });
    });

    describe('underscore collection methods', function() {
        beforeEach(function() {
            graph.set(mockItems);
        });

        it('pass function iteratees unmodified', function() {
            expect(graph.filter(model => model.has(oa.hasBody)).length).toBe(5);
        });

        it('pass string iteratees to our JSON-LD aware wrapper', function() {
            expect(graph.filter(oa.hasBody).length).toBe(5);
        });

        it('pass hash iteratees to our JSON-LD aware wrapper', function() {
            expect(graph.filter({
                [oa.motivatedBy]: { '@id': oa.tagging },
            }).length).toBe(5);
            expect(graph.filter({
                [oa.motivatedBy]: [{ '@id': oa.tagging }],
            }).length).toBe(5);
        });

        it('pass array iteratees to our JSON-LD aware wrapper', function() {
            expect(graph.filter([oa.hasBody, oa.motivatedBy]).length).toBe(5);
        });

        it('pass subject instances to the underlying algorithm', function() {
            const subject = graph.get(anno1Instance);
            expect(graph.includes(subject)).toBeTruthy();
        });
    });
});
