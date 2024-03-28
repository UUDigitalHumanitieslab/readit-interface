import { startStore, endStore } from '../test-util';

import { rdf, rdfs, xsd, owl, skos, item } from '../common-rdf/ns';
import { FlatLdObject, FlatLdGraph } from '../common-rdf/json';
import Subject from '../common-rdf/subject';
import Graph from '../common-rdf/graph';

import {
    getLabel,
    getLabelFromId,
    getTurtleTerm,
    cssClassCache,
    getCssClassName,
    isRdfsClass,
    isRdfProperty,
    isOntologyClass,
    isBlank,
    transitiveClosure,
    getRdfSuperClasses,
    getRdfSubClasses,
} from './linked-data-utilities';

function getDefaultSubject(): Subject {
    return new Subject(getDefaultAttributes());
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
            let subject = getDefaultSubject();
            expect(getLabel(subject)).toBe('Content');
        });

        it('returns a preferred label before others', function () {
            let subject = getDefaultSubject();
            expect(getLabel(subject)).toBe('Content');
        });

        it('returns alternative label if the preferred label is not present', function () {
            let attributes = getDefaultAttributes();
            delete attributes[skos.prefLabel];
            let subject = new Subject(attributes);
            expect(getLabel(subject)).toBe('alternativeLabel');
        });

        it('falls back on the id when there is no explicit label', function() {
            const subject = new Subject({'@id': 'x'});
            expect(getLabel(subject)).toBe('x');
        });
    });

    describe('getLabelFromId', function () {
        it('returns a label', function () {
            let subject = getDefaultSubject();
            expect(getLabelFromId(subject.get('@id'))).toBe('Content');
        });

        it('returns a label for a property', function () {
            let subject = getDefaultSubject();

            for (let att in subject.attributes) {
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

    describe('getTurtleTerm', function() {
        it('returns ns:term format for terms in known namespaces', function() {
            expect(getTurtleTerm(xsd.string)).toBe('xsd:string');
            expect(getTurtleTerm(xsd('oopsie'))).toBe('xsd:oopsie');
            expect(getTurtleTerm(rdfs.Literal)).toBe('rdfs:Literal');
        });

        it('returns <full-uri> notation otherwise', function() {
            expect(getTurtleTerm('https://banana.org/banana'))
                .toBe('<https://banana.org/banana>');
            expect(getTurtleTerm('banana'))
                .toBe('<banana>');
        });

        it('extracts URIs from Subjects', function() {
            const subject = getDefaultSubject();
            expect(getTurtleTerm(subject)).toBe('item:Content');
            subject.set('@id', xsd.string);
            expect(getTurtleTerm(subject)).toBe('xsd:string');
            subject.set('@id', 'banana');
            expect(getTurtleTerm(subject)).toBe('<banana>');
        });
    });

    describe('getCssClassName', function () {
        afterEach(function() {
            for (let key in cssClassCache) delete cssClassCache[key];
        });

        it('returns a css class', function () {
            let subject = getDefaultSubject();
            expect(getCssClassName(subject)).toBe('is-readit-content');
        });

        it('returns a lowercased css class stripped of spaces', function () {
            let attributes = getDefaultAttributes();
            attributes[skos.prefLabel] = [{ "@value": "A Capitalized Label With Spaces" }];
            let subject = new Subject(attributes);
            expect(getCssClassName(subject)).toBe('is-readit-acapitalizedlabelwithspaces');
        });
    });

    describe('isRdfsClass', function () {
        it('recognizes type rdfs:Class', function () {
            let subject = getDefaultSubject();
            expect(isRdfsClass(subject)).toBeTruthy();
        });

        it('recognizes type rdfs:subClassOf', function () {
            let attributes = getDefaultAttributes();
            attributes['@type'] = [rdfs('notClass')];
            attributes[rdfs.subClassOf] = [{ '@id': 'anything' }]
            let subject = new Subject(attributes);

            expect(isRdfsClass(subject)).toBeTruthy();
        });

        it('ignores other types', function () {
            let attributes = getDefaultAttributes();
            attributes['@type'] = [rdf.Property];
            let subject = new Subject(attributes);

            expect(isRdfsClass(subject)).toBeFalsy();
        });
    });

    describe('isRdfProperty', function() {
        it('recognizes straight-on properties', function() {
            const yes = new Subject({ '@type': rdf.Property }), no = new Subject();
            expect(isRdfProperty(yes)).toBeTruthy();
            expect(isRdfProperty(no)).toBeFalsy();
        });

        it('recognizes OWL object properties', function() {
            const owlProp = new Subject({ '@type': owl.ObjectProperty });
            expect(isRdfProperty(owlProp)).toBeTruthy();
        });

        it('recognizes subproperties', function() {
            const subProp = new Subject({ [rdfs.subPropertyOf]: rdfs.range });
            expect(isRdfProperty(subProp)).toBeTruthy();
        });

        it('recognizes inverse properties', function() {
            const inverseProp = new Subject({ [owl.inverseOf]: rdfs.range });
            expect(isRdfProperty(inverseProp)).toBeTruthy();
        });
    });

    describe('isOntologyClass', function() {
        it('is robust against Subjects without an id', function() {
            const subject = new Subject();
            expect(isOntologyClass(subject)).toBeFalsy();
        });
    });

    describe('isBlank', function() {
        it('detects blank nodes', function() {
            const subject = new Subject({'@id': '_:b0'});
            expect(isBlank(subject)).toBeTruthy();
        });

        it('passes URI nodes', function() {
            const subject = new Subject({'@id': 'http://example.com/'});
            expect(isBlank(subject)).toBeFalsy();
        });

        it('does not replace .isNew()', function() {
            const subject = new Subject();
            expect(isBlank(subject)).toBeFalsy();
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
                this.traverseLikes = subject => {
                    return (subject.get('likes') || []).map(this.select) as Subject[];
                };
            });

            it('finds all Subjects connected by a given relation', function() {
                const seed = ['cat', 'dog'].map(this.select) as Subject[];
                expectIds(transitiveClosure(seed, this.traverseLikes), [
                    'bird', 'cat', 'cheese', 'dog', 'fish', 'mouse',
                ]);
            });
        });

        describe('getRdfSuperClasses', function() {
            beforeEach(startStore);
            beforeEach(init);
            afterEach(endStore);

            it('finds all known ancestors for given classes', function() {
                expectIds(getRdfSuperClasses(['carnivore']), [
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
