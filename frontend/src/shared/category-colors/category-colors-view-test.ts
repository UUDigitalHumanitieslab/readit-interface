import { enableI18n } from '../../test-util';

import Graph from '../../jsonld/graph';
import Node from '../../jsonld/node';
import { JsonLdObject } from '../../jsonld/json';
import CategoryColorsView from './category-colors-view';

describe('CategoryColorsView', function() {
    beforeAll(enableI18n);

    beforeEach(function() {
        let attributes: JsonLdObject = {
            '@id': 'uniqueID',
            '@type': 'rdfs:Class',
            'skos:prefLabel': 'test',
            'schema:color': 'hotpink'
        }
        let node = new Node(attributes);
        let graph = new Graph([node]);
        this.view = new CategoryColorsView({ collection: graph });
    });

    it('parses graphs into cssClass and color', function() {
        let expected = {
            class: 'is-readit-test',
            color: 'hotpink'
        };

        expect(this.view.categoryColors[0]).toEqual(expected);
    });

    it('renders a style tag with some CSS in it', function() {
        expect(this.view.render().$el.prop("tagName")).toEqual('STYLE');

        let html = this.view.render().$el.html();
        let actual = replaceNewLinesAndWhitespace(html);

        expect(actual).toEqual('.is-readit-test{background-color:hotpink!important}');
    });

    it('renders a style tag with multiple CSS classes in it', function() {
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

        let graph = new Graph([node1, node2]);
        let view = new CategoryColorsView({collection: graph});

        expect(view.render().$el.prop("tagName")).toEqual('STYLE');

        let html = view.render().$el.html();
        let actual = replaceNewLinesAndWhitespace(html);

        expect(actual).toEqual('.is-readit-test{background-color:hotpink!important}.is-readit-test2{background-color:aliceblue!important}');
    });

    function replaceNewLinesAndWhitespace(text: string) {
        return text.replace(/(?:\r\n|\r|\n| )/g, "");
    }
});



