import { constant } from 'lodash';

import { startStore, endStore } from '../test-util';
import mockOntology from '../mock-data/mock-ontology';
import { anno2ReaderInstance } from '../mock-data/mock-items';

import ldChannel from '../common-rdf/radio';
import { readit, skos, rdfs } from '../common-rdf/ns';
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
        it('returns the predicates applicable to a given item', function() {
            const Blessington = new Node(anno2ReaderInstance);
            const predicates = applicablePredicates(Blessington);
            expect(predicates.length).toBe(2);
            expect(predicates.at(0).get(skos.prefLabel)[0]).toBe('description of');
            expect(predicates.at(1).get(rdfs.label)[0]).toBe('inverse of description of');
        });

        it('returns the predicates applicable to a given @type', function() {
            const predicates = applicablePredicates(readit('Reader'));
            expect(predicates.length).toBe(2);
            expect(predicates.at(0).get(skos.prefLabel)[0]).toBe('description of');
            expect(predicates.at(1).get(rdfs.label)[0]).toBe('inverse of description of');
        });
    });
});
