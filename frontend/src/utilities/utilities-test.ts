import { rdf, rdfs, skos } from './../jsonld/ns';
import { getLabel, getCssClassName, isRdfsClass } from './utilities';
import { FlatLdObject } from '../jsonld/json';
import Node from '../jsonld/node';

function getDefaultNode(): Node {
    return new Node(getDefaultAttributes());
}

function getDefaultAttributes(): FlatLdObject {
    return {
        '@id': 'uniqueID',
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

        it('ignores nodes without a label', function () {
            let attributes = getDefaultAttributes();
            delete attributes[skos.prefLabel];
            delete attributes[skos.altLabel];
            let node = new Node(attributes);
            expect(getCssClassName(node)).toBeNull();
        });
    });

    describe('isRdfsClass', function () {
        it('recognizes type rdfs:Class', function () {
            let node = getDefaultNode();
            expect(isRdfsClass(node)).toBe(true);
        });

        it('recognizes type rdfs:subClassOf', function () {
            let attributes = getDefaultAttributes();
            attributes['@type'] = [rdfs('notClass')];
            attributes[rdfs.subClassOf] = [{ '@id': 'anything' }]
            let node = new Node(attributes);

            expect(isRdfsClass(node)).toBe(true);
        });

        it('ignores other types', function () {
            let attributes = getDefaultAttributes();
            attributes['@type'] = [rdf.Property];
            let node = new Node(attributes);

            expect(isRdfsClass(node)).toBe(false);
        });
    });
});
