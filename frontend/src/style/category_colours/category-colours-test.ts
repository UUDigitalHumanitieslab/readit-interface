import { enableI18n } from './../../test-util';

import Graph from './../../jsonld/graph';
import Node from './../../jsonld/node';
import { JsonLdObject } from './../../jsonld/json';
import CategoryColoursView from './category-colours-view';

describe('CategoryColoursView', function() {
    beforeAll(enableI18n);

    beforeEach(function() {
        let attributes: JsonLdObject = {
            '@id': 'uniqueID',
            '@type': 'rdfs:Class',
            'skos:prefLabel': 'test',
            'schema:color': 'hotpink'
        }
        let node = new Node(attributes);
        let graph = new Graph();
        graph.push(node);
        this.view = new CategoryColoursView({ collection: graph });
    });

    it('parses graphs into cssClass and colour', function() {
        let expected = {
            class: 'is-readit-test',
            colour: 'hotpink'
        };

        let actual = this.view.categoryColours[0];
        expect(this.view.categoryColours[0]).toEqual(expected);
    });

    it('renders a style tag with some CSS in it', function() {
        expect(this.view.render().$el.prop("tagName")).toEqual('STYLE');

        let html = this.view.render().$el.html();
        expect(html).toContain('.is-readit-test {');
        expect(html).toContain('background-color: hotpink !important');
        expect(html).toContain('}');
    });

    it('renders a script tag with multiple CSS classes in it', function() {
        let attributes1: JsonLdObject = {
            '@id': 'uniqueID',
            '@type': 'rdfs:Class',
            'skos:prefLabel': 'test',
            'schema:color': 'hotpink'
        }
        let node1 = new Node(attributes1);

        let attributes2: JsonLdObject = {
            '@id': 'uniqueID2',
            '@type': 'rdfs:Class',
            'skos:prefLabel': 'test2',
            'schema:color': 'aliceblue'
        }
        let node2 = new Node(attributes2);

        let graph = new Graph();
        graph.push(node1);
        graph.push(node2);
        let view = new CategoryColoursView({collection: graph});

        expect(view.render().$el.prop("tagName")).toEqual('STYLE');
        expect(view.render().$el.html()).toContain('.is-readit-test {');
        expect(view.render().$el.html()).toContain('.is-readit-test2 {');
    });
});


