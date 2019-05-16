import { getLabel } from './utilities';
import { JsonLdObject } from './../jsonld/json';
import Node from './../jsonld/node';

describe('getLabel', function() {
    
    it('returns a name', function() {
        let attributes: JsonLdObject = { '@id': 'uniqueID', 'skos:prefLabel': 'prefLabel', '@context': {} }
        let node = new Node(attributes);
        expect(getLabel(node)).toBe('prefLabel');
    });

    it('returns a preferred name before others', function() {
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
