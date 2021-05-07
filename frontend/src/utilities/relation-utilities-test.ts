import { constant } from 'lodash';

import { startStore, endStore } from '../test-util';
import mockOntology from '../mock-data/mock-ontology';

import ldChannel from '../common-rdf/radio';
import { readit, skos } from '../common-rdf/ns';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';

import { applicablePredicates } from './relation-utilities';

describe('relation utilities', function() {
    beforeEach(startStore);

    beforeEach(function() {
        const ontology = new Graph(mockOntology);
        ldChannel.reply('ontology:graph', constant(ontology));
    });

    afterEach(function() {
        ldChannel.stopReplying('ontology:graph');
    });

    afterEach(endStore);

    describe('applicablePredicates', function() {
        it('returns the predicates applicable to a given class', function() {
            const Reader = ldChannel.request('obtain', readit('Reader'));
            const predicates = applicablePredicates(Reader);
            expect(predicates.length).toBe(2);
            expect(predicates.at(0).get(skos.prefLabel)).toBe('description of');
            expect(predicates.at(1).get(skos.prefLabel)).toBe('inverse of description of');
        });
    });
});
