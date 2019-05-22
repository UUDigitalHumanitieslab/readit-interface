import { getLabel, getCssClassName } from './utilities';
import { JsonLdObject } from '../jsonld/json';
import Node from '../jsonld/node';

describe('getLabel', function() {

    it('returns a label', function() {
        let attributes: JsonLdObject = { '@id': 'uniqueID', 'skos:prefLabel': 'prefLabel', '@context': {} }
        let node = new Node(attributes);
        expect(getLabel(node)).toBe('prefLabel');
    });

    it('returns a preferred label before others', function() {
        let attributes: JsonLdObject = {
            '@id': 'uniqueID',
            'skos:prefLabel': 'prefLabel',
            'skos:altLabel': 'altLabel',
            'test:yetAnotherLabel': 'yetAnotherLabel'
        }
        let node = new Node(attributes);
        expect(getLabel(node)).toBe('prefLabel');
    });
});

describe('getCssClassName', function() {

    it('returns a css class', function() {
        let attributes: JsonLdObject = {
            '@id': 'uniqueID',
            '@type': 'rdfs:Class',
            'skos:prefLabel': 'prefLabel',
        }
        let node = new Node(attributes);
        expect(getCssClassName(node)).toBe('is-readit-preflabel');
    });

    it('returns a lowercased css class stripped of spaces', function() {
        let attributes: JsonLdObject = {
            '@id': 'uniqueID',
            '@type': 'rdfs:Class',
            'skos:prefLabel': 'A Capitalized Label With Spaces',
        }
        let node = new Node(attributes);
        expect(getCssClassName(node)).toBe('is-readit-acapitalizedlabelwithspaces');
    });

    it('ignores nodes without a label', function() {
        let attributes: JsonLdObject = {
            '@id': 'uniqueID',
            '@type': 'rdfs:Class',
        }
        let node = new Node(attributes);
        expect(getCssClassName(node)).toBeNull();
    });

    it('ignores node with type other that rdfs:Class', function() {
        let attributes: JsonLdObject = {
            '@id': 'uniqueID',
            '@type': 'rdfs:SomethingElse',
        }
        let node = new Node(attributes);
        expect(getCssClassName(node)).toBeNull();
    });
});
