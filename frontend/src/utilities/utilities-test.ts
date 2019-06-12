import { rdfs, skos } from './../jsonld/ns';
import { getLabel, getCssClassName, isRdfsClass, hasProperty } from './utilities';
import { JsonLdObject } from '../jsonld/json';
import Node from '../jsonld/node';

function getDefaultNode(): Node {
    return new Node(getDefaultAttributes());
}

function getDefaultAttributes(): JsonLdObject {
    return {
        '@id': 'uniqueID',
        "@type": [
            { '@id': rdfs.Class }
        ],
        [skos.prefLabel]: [
            { '@value': 'Content' },
        ],
        [skos.altLabel]: [
            { '@value': 'alternativeLabel'}
        ],
    }
}

describe('utilities:getLabel', function() {

    it('returns a label', function() {
        let node = getDefaultNode();
        expect(getLabel(node)).toBe('Content');
    });

    it('returns a preferred label before others', function() {
        let node = getDefaultNode();
        expect(getLabel(node)).toBe('Content');
    });

    it('returns alternative label if the preferred label is not present', function() {
        let attributes = getDefaultAttributes();
        delete attributes[skos.prefLabel];
        let node = new Node(attributes);
        expect(getLabel(node)).toBe('alternativeLabel');
    });
});

describe('utilities:getCssClassName', function() {

    it('returns a css class', function() {
        let node = getDefaultNode();
        expect(getCssClassName(node)).toBe('is-readit-content');
    });

    it('returns a lowercased css class stripped of spaces', function() {
        let attributes = getDefaultAttributes();
        attributes[skos.prefLabel] = [{ "@value": "A Capitalized Label With Spaces" }];
        let node = new Node(attributes);
        expect(getCssClassName(node)).toBe('is-readit-acapitalizedlabelwithspaces');
    });

    it('ignores nodes without a label', function() {
        let attributes = getDefaultAttributes();
        delete attributes[skos.prefLabel];
        delete attributes[skos.altLabel];
        let node = new Node(attributes);
        expect(getCssClassName(node)).toBeNull();
    });

    it('ignores node with type other that rdfs:Class', function() {
        let attributes = getDefaultAttributes();
        attributes['@type'] = [{ '@id': 'rdfs:SomethingElse' }];
        let node = new Node(attributes);
        expect(getCssClassName(node)).toBeNull();
    });
});

describe('utilities:isRdfsClass', function() {
    it('recognizes type rdfs:Class', function() {
        let node = getDefaultNode();
        expect(isRdfsClass(node)).toBe(true);
    });

    it('recognizes type rdfs:subClassOf', function() {
        let attributes = getDefaultAttributes();
        attributes['@type'] = [{ '@id': rdfs('notClass') }];
        attributes[rdfs.subClassOf] = [{ '@id': 'anything'}]
        let node = new Node(attributes);

        expect(isRdfsClass(node)).toBe(true);
    });

    it('ignores other types', function() {
        let attributes = getDefaultAttributes();
        attributes['@type'] = [{ '@id': [rdfs.Resource] }];
        let node = new Node(attributes);

        expect(isRdfsClass(node)).toBe(false);
    });
});

describe('utilities:hasProperty', function() {
    it('finds a property', function() {
        let node = getDefaultNode();
        expect(hasProperty(node, skos.prefLabel)).toBe(true);
    });

    it('ignores empty values unless told otherwise', function() {
        let property = skos.prefLabel;
        let attributes = getDefaultAttributes();
        attributes[property] = [];
        let node = new Node(attributes);
        expect(hasProperty(node, property)).toBe(false);
    });
});
