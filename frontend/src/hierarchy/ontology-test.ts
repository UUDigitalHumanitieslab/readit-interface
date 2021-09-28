import { map, isArray } from 'lodash';

import { startStore, endStore } from '../test-util';
import mockOntology from '../mock-data/mock-tiered-ontology';
import mockNLP from '../mock-data/mock-nlp-ontology';

import { skos, cidoc, readit, nlp } from '../common-rdf/ns';
import Model from '../core/model';
import Collection from '../core/collection';
import { isNode } from '../common-rdf/node';
import Graph from '../common-rdf/graph';
import FilteredCollection from '../common-adapters/filtered-collection';
import { isColoredClass } from '../utilities/linked-data-utilities';

import { hierarchyFromOntology, hierarchyFromNLPOntology } from './ontology';

// The following are highly condensed summaries of the expected hierarchies,
// including only the ids of the inner models.

const expectedFullOntology = [
    [cidoc('E21_Person'), [
        readit('REO5'),
    ]],
    readit('readP3'),
    [readit('REO23'), [
        readit('REO20'),
    ]],
];

const expectedColoredOntology = [
    [cidoc('E21_Person'), [
        readit('REO5'),
    ]],
    [readit('REO23'), [
        readit('REO20'),
    ]],
];

const expectedFullNLP = [
    nlp('content'),
    skos.definition,
    nlp().slice(0, -1),
    nlp('confidence'),
    nlp('was_detected_by_model'),
    [nlp('nlp_result'), [
        nlp('reading_testimony'),
        [nlp('named_entity'), [
            nlp('time'),
            nlp('work_of_art'),
        ]],
    ]],
];

const expectedColoredNLP = [
    nlp('reading_testimony'),
    nlp('time'),
    nlp('work_of_art'),
];

const idFromOuterModel = m => m.get('model').id;
const idFromSummary = entry => isArray(entry) ? entry[0] : entry;

// Compare a piece of data model according to the convention described in
// ./hierarchy-view against a piece of condensed hierarchy like above.
function expectHierarchy(summary, actual) {
    expect(actual.map(idFromOuterModel)).toEqual(map(summary, idFromSummary));
    actual.each(function(outerModel, index) {
        const modelContext = JSON.stringify(outerModel);
        const collection = outerModel.get('collection');
        const currentSummary = summary[index];
        if (isArray(currentSummary)) {
            expect(collection instanceof Collection)
                .withContext(`hasCollection: ${modelContext}`)
                .toBe(true);
            expectHierarchy(currentSummary[1], collection);
        } else {
            expect(collection)
                .withContext(`noCollection: ${modelContext}`)
                .toBeUndefined();
        }
    });
}

describe('ontology hierarchy algorithms', function() {
    beforeAll(startStore);
    afterAll(endStore);

    describe('hierarchyFromOntology', function() {
        beforeAll(function() {
            this.graph = new Graph(mockOntology);
        });

        describe('with a full ontology', function() {
            it('clusters subjects based on skos:related', function() {
                const hierarchy = hierarchyFromOntology(this.graph);
                expectHierarchy(expectedFullOntology, hierarchy);
            });
        });

        describe('with just colored classes', function() {
            beforeAll(function() {
                this.colored = new FilteredCollection(this.graph, isColoredClass);
            });

            it('omits anything that is not a colored class', function() {
                const hierarchy = hierarchyFromOntology(this.colored);
                expectHierarchy(expectedColoredOntology, hierarchy);
            });
        });
    });

    describe('hierarchyFromNLPOntology', function() {
        beforeAll(function() {
            this.graph = new Graph(mockNLP);
        });

        describe('with a full ontology', function() {
            it('clusters subjects based on rdfs:subClassOf', function() {
                const hierarchy = hierarchyFromNLPOntology(this.graph);
                expectHierarchy(expectedFullNLP, hierarchy);
            });
        });

        describe('with just colored classes', function() {
            beforeAll(function() {
                this.colored = new FilteredCollection(this.graph, isColoredClass);
            });

            it('simplifies the hierarchy, preserves nesting order', function() {
                const hierarchy = hierarchyFromNLPOntology(this.colored);
                expectHierarchy(expectedColoredNLP, hierarchy);
            });
        });
    });
});