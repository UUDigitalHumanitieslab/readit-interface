import {
    each,
    map,
    mapValues,
    extend,
    constant,
    flowRight as compose,
    propertyOf,
} from 'lodash';
import { Collection as BCollection } from 'backbone';

import { startStore, endStore, event } from '../test-util';
import mockOntology from '../mock-data/mock-ontology';
import mockItems, { anno2ReaderInstance } from '../mock-data/mock-items';

import ldChannel from '../common-rdf/radio';
import { readit, item, skos, rdfs } from '../common-rdf/ns';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';
import FlatItem from '../common-adapters/flat-item-model';
import ItemGraph from '../common-adapters/item-graph';

import { asURI } from './linked-data-utilities';
import { applicablePredicates, relationsFromModel } from './relation-utilities';

const inverseRelated = {
    [item('600')]: [item('202'), item('203')],
    [item('601')]: [item('202')],
    [item('200')]: [item('202')],
};

// Highly generic higher order utility function, somewhat of a crossbreed
// between `_.identity` and `_.constant`, which can be composed with other
// functions in order to ensure that the return value is always existy. Also
// potentially useful as an iteratee. Defined here in a test module because no
// need has come up in other parts of the application yet. TODO: add this to
// underscore-contrib.
function fallback(defaultValue) {
    return function(value) {
        return value == null ? defaultValue : value;
    }
}

// Produce an `ItemGraph` that pretends to have executed a query to the backend,
// so that its `.ready` method can be used. In reality, we have just
// prepopulated it with a fixed set of nodes.
function fakeItemCache(nodes?: Array<Node>) {
    const graph = new ItemGraph(nodes);
    const fakeXHR = Promise.resolve(graph);
    graph.promise = fakeXHR as unknown as JQuery.jqXHR;
    return graph;
}

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

    describe('relationsFromModel', function() {
        beforeEach(function() {
            const items = new Graph(mockItems);
            const getItem = items.get.bind(items);
            const inverse = mapValues(inverseRelated, (ids) =>
                // The type annotation on the next line really shouldn't be
                // necessary.
                fakeItemCache(map(ids, getItem) as unknown as Node[])
            );
            const defaultEmpty = fallback(fakeItemCache());
            const fromInverse = propertyOf(inverse);
            const getInverse = compose(defaultEmpty, fromInverse, asURI);
            ldChannel.reply('cache:inverse-related', getInverse);
        });

        afterEach(function() {
            ldChannel.stopReplying('cache:inverse-related');
        });

        it('returns a collection of {predicate, object} models', async function() {
            const model = ldChannel.request('obtain', item('202'));
            const predicates = applicablePredicates(model);
            const relations = relationsFromModel(model, predicates);
            expect(relations).toEqual(jasmine.any(BCollection));
            await event(relations, 'complete');
            // Based on `inverseRelated` we would actually expect 3 relations,
            // but one of them is not included because our mock ontology
            // includes only `readit('descriptionOf')` as a predicate that
            // applies to `readit('Reader')`.
            expect(relations.length).toBe(2);
            const descriptionOf = ldChannel.request('obtain', readit('descriptionOf'));
            const otherItems = map(['600', '601'], serial =>
                ldChannel.request('obtain', item(serial))
            );
            const relatedFound = map(otherItems, item =>
                relations.find(relation =>
                    relation.get('predicate') === descriptionOf &&
                    relation.get('object') === item
                )
            );
            each(relatedFound, found => expect(found).toBeDefined());
        });
    });
});
