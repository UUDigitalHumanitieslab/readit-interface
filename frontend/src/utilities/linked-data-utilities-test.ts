import { startStore, endStore } from '../test-util';

import { rdf, rdfs, owl, skos, item } from '../common-rdf/ns';
import { FlatLdObject, FlatLdGraph } from '../common-rdf/json';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';

import {
    getLabel,
    getLabelFromId,
    getCssClassName,
    isRdfsClass,
    isRdfProperty,
    isOntologyClass,
    isBlank,
    transitiveClosure,
    getRdfParentNodes,
    getRdfSubClasses,
} from './linked-data-utilities';

function getDefaultNode(): Node {
    return new Node(getDefaultAttributes());
}

function getDefaultAttributes(): FlatLdObject {
    return {
        '@id': item('Content'),
        "@type": [
            rdfs.Class
        ],
        [skos.prefLabel]: [
            { '@value': 'Content' },
        ],
        [skos.altLabel]: [
            { '@value': 'alternativeLabel' }
        ],
    }
}

const connectedTestGraph: FlatLdGraph = [{
    '@id': 'cat',
    [rdfs.subClassOf]: [{'@id': 'carnivore'}, {'@id': 'hydrophobic'}],
    likes: [{'@id': 'fish'}, {'@id': 'bird'}, {'@id': 'mouse'}],
}, {
    '@id': 'carnivore',
    [rdfs.subClassOf]: [{'@id': 'animal'}],
}, {
    '@id': 'fish',
    [rdfs.subClassOf]: [{'@id': 'animal'}, {'@id': 'hydrophilic'}],
}, {
    '@id': 'bird',
    [rdfs.subClassOf]: [{'@id': 'animal'}],
}, {
    '@id': 'mouse',
    [rdfs.subClassOf]: [{'@id': 'omnivore'}],
    likes: [{'@id': 'cheese'}],
}, {
    '@id': 'cheese',
    [rdfs.subClassOf]: [{'@id': 'hydrophobic'}],
}, {
    '@id': 'dog',
    [rdfs.subClassOf]: [{'@id': 'carnivore'}, {'@id': 'hydrophilic'}],
    likes: [{'@id': 'mouse'}, {'@id': 'bird'}, {'@id': 'ball'}],
}, {
    '@id': 'carnivore',
    [rdfs.subClassOf]: [{'@id': 'animal'}],
}, {
    '@id': 'omnivore',
    [rdfs.subClassOf]: [{'@id': 'animal'}],
}, {
    '@id': 'herbivore',
    [rdfs.subClassOf]: [{'@id': 'animal'}],
}, {
    '@id': 'animal',
    [rdfs.subClassOf]: [{'@id': 'organism'}],
}, {
    '@id': 'organism',
}, {
    '@id': 'tiger',
    [rdfs.subClassOf]: [{'@id': 'cat'}],
}, {
    '@id': 'chihuahua',
    [rdfs.subClassOf]: [{'@id': 'dog'}],
}];

describe('utilities', function () {
    describe('getLabel', function () {

        it('returns a label', function () {
            let node = getDefaultNode();
            expect(getLabel(node)).toBe('Content');
        });

        it('returns a preferred label before others', function () {
            let node = getDefaultNode();
            expect(getLabel(node)).toBe('Content');
        });

        it('returns alternative label if the preferred label is not present', function () {
            let attributes = getDefaultAttributes();
            delete attributes[skos.prefLabel];
            let node = new Node(attributes);
            expect(getLabel(node)).toBe('alternativeLabel');
        });

        it('falls back on the id when there is no explicit label', function() {
            const node = new Node({'@id': 'x'});
            expect(getLabel(node)).toBe('x');
        });
    });

    describe('getLabelFromId', function () {
        it('returns a label', function () {
            let node = getDefaultNode();
            expect(getLabelFromId(node.get('@id'))).toBe('Content');
        });

        it('returns a label for a property', function () {
            let node = getDefaultNode();

            for (let att in node.attributes) {
                if (att == skos.prefLabel) {
                    expect(getLabelFromId(att)).toBe('prefLabel')
                }

                if (att == skos.altLabel) {
                    expect(getLabelFromId(att)).toBe('altLabel')
                }
            }
        });

        it('returns the whole string if it lacks structure', function() {
            expect(getLabelFromId('1')).toBe('1');
        });

        it('handles null and undefined', function() {
            expect(getLabelFromId(undefined)).toBeUndefined();
            expect(getLabelFromId(null)).toBeUndefined();
        });
    });

    describe('getCssClassName', function () {
        it('returns a css class', function () {
            let node = getDefaultNode();
            expect(getCssClassName(node)).toBe('is-readit-content');
        });

        it('returns a lowercased css class stripped of spaces', function () {
            let attributes = getDefaultAttributes();
            attributes[skos.prefLabel] = [{ "@value": "A Capitalized Label With Spaces" }];
            let node = new Node(attributes);
            expect(getCssClassName(node)).toBe('is-readit-acapitalizedlabelwithspaces');
        });
    });

    describe('isRdfsClass', function () {
        it('recognizes type rdfs:Class', function () {
            let node = getDefaultNode();
            expect(isRdfsClass(node)).toBeTruthy();
        });

        it('recognizes type rdfs:subClassOf', function () {
            let attributes = getDefaultAttributes();
            attributes['@type'] = [rdfs('notClass')];
            attributes[rdfs.subClassOf] = [{ '@id': 'anything' }]
            let node = new Node(attributes);

            expect(isRdfsClass(node)).toBeTruthy();
        });

        it('ignores other types', function () {
            let attributes = getDefaultAttributes();
            attributes['@type'] = [rdf.Property];
            let node = new Node(attributes);

            expect(isRdfsClass(node)).toBeFalsy();
        });
    });

    describe('isRdfProperty', function() {
        it('recognizes straight-on properties', function() {
            const yes = new Node({ '@type': rdf.Property }), no = new Node();
            expect(isRdfProperty(yes)).toBeTruthy();
            expect(isRdfProperty(no)).toBeFalsy();
        });

        it('recognizes OWL object properties', function() {
            const owlProp = new Node({ '@type': owl.ObjectProperty });
            expect(isRdfProperty(owlProp)).toBeTruthy();
        });

        it('recognizes subproperties', function() {
            const subProp = new Node({ [rdfs.subPropertyOf]: rdfs.range });
            expect(isRdfProperty(subProp)).toBeTruthy();
        });

        it('recognizes inverse properties', function() {
            const inverseProp = new Node({ [owl.inverseOf]: rdfs.range });
            expect(isRdfProperty(inverseProp)).toBeTruthy();
        });
    });

    describe('isOntologyClass', function() {
        it('is robust against nodes without an id', function() {
            const node = new Node();
            expect(isOntologyClass(node)).toBeFalsy();
        });
    });

    describe('isBlank', function() {
        it('detects blank nodes', function() {
            const node = new Node({'@id': '_:b0'});
            expect(isBlank(node)).toBeTruthy();
        });

        it('passes URI nodes', function() {
            const node = new Node({'@id': 'http://example.com/'});
            expect(isBlank(node)).toBeFalsy();
        });

        it('does not replace .isNew()', function() {
            const node = new Node();
            expect(isBlank(node)).toBeFalsy();
        });
    });

    describe('traversion algorithms', function() {
        beforeEach(function() {
            this.graph = new Graph();
            this.select = n => this.graph.get(n);
        });

        function init() {
            this.graph.reset(connectedTestGraph);
        }

        function expectIds(closure, ids) {
            expect(closure.map(n => n.id).sort()).toEqual(ids);
        }

        describe('transitiveClosure', function() {
            beforeEach(init);
            beforeEach(function() {
                this.traverseLikes = node => {
                    return (node.get('likes') || []).map(this.select) as Node[];
                };
            });

            it('finds all Nodes connected by a given relation', function() {
                const seed = ['cat', 'dog'].map(this.select) as Node[];
                expectIds(transitiveClosure(seed, this.traverseLikes), [
                    'bird', 'cat', 'cheese', 'dog', 'fish', 'mouse',
                ]);
            });
        });

        describe('getRdfParentNodes', function () {
            beforeEach(startStore);
            beforeEach(init);
            afterEach(endStore);

            it('finds all known ancestors for given classes', function() {
                expectIds(getRdfParentNodes(['carnivore']), [
                    'animal', 'carnivore', 'organism',
                ]);
            });
        });

        describe('getRdfSubClasses', function() {
            beforeEach(startStore);
            beforeEach(init);
            afterEach(endStore);

            it('finds all known descendants for given classes', function() {
                expectIds(getRdfSubClasses(['carnivore']), [
                    'carnivore', 'cat', 'chihuahua', 'dog', 'tiger',
                ]);
            });
        });
    });
});
