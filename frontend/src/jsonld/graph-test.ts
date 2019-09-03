import mockItems from '../mock-data/mock-items';
import { oa } from './ns';
import Graph from './graph';

describe('Graph', function() {
    let graph;

    beforeEach(function() {
        graph = new Graph();
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
    });
});
