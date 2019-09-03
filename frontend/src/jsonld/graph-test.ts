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
    });
});
