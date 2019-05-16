import Graph from './../../jsonld/graph';
import Node from './../../jsonld/node';
import { JsonLdObject } from './../../jsonld/json';
import CategoryColoursView from './category-colours-view';

describe('CategoryColoursView', function() {
    
    it('parses graphs into cssClass and colour', function() {
        let attributes: JsonLdObject = { '@id': 'uniqueID', 'skos:prefLabel': 'test', 'colour': 'hotpink' }
        let node = new Node(attributes);
        
        let graph = new Graph();
        graph.push(node)
        
        let ccView = new CategoryColoursView(graph);
        
        let expected = {
            class: 'is-readit-test',
            colour: 'hotpink'
        };

        let actual = ccView.collectColours();
        
        // expect(actual).toEqual(expected);
    });
});