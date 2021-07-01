import { constant } from 'lodash';

import { startStore, endStore, event } from '../test-util';
import mockOntology from '../mock-data/mock-ontology';
import { anno2ReaderInstance } from '../mock-data/mock-items';

import ldChannel from '../common-rdf/radio';
import { readit, skos, rdfs } from '../common-rdf/ns';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';
import FlatItem from '../common-adapters/flat-item-model';

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

        it('generates inverse properties that can be flattened', async function() {
            const inverse = applicablePredicates(readit('Reader')).at(1);
            const flat = new FlatItem(inverse);
            await event(flat, 'complete');
            expect(flat.get('classLabel')).toBe('inverse of description of');
        });
    });
});
