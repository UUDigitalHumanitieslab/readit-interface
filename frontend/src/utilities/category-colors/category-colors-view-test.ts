import { enableI18n } from '../../test-util';

import Graph from '../../jsonld/graph';
import Node from '../../jsonld/node';
import { JsonLdObject } from '../../jsonld/json';
import CategoryColorsView from './category-colors-view';






function getDefaultNode(): Node {
    return new Node(getDefaultAttributes());
}

function getDefaultAttributes(): JsonLdObject {
    return {
        '@id': '1',
        "@type": [
            { '@id': "rdfs:Class" }
        ],
        'http://www.w3.org/2004/02/skos/core#prefLabel': [
            { '@value': 'Content' },
        ],
        'http://www.w3.org/2004/02/skos/core#definition': [
            { '@value': 'This is a test definition'}
        ],
        'http://schema.org/color': [
            { '@value': 'hotpink'}
        ]
    }
}

describe('CategoryColorsView', function() {
    beforeAll(enableI18n);

    beforeEach(function() {
        let graph = new Graph([getDefaultNode()]);
        this.view = new CategoryColorsView({ collection: graph });
    });

    it('parses graphs into cssClass and color', function() {
        let expected = {
            class: 'is-readit-content',
            color: 'hotpink'
        };

        expect(this.view.categoryColors[0]).toEqual(expected);
    });

    it('renders a HTML style tag with some CSS in it', function() {
        expect(this.view.render().$el.prop("tagName")).toEqual('STYLE');

        let html = this.view.render().$el.html();
        let actual = replaceNewLinesAndWhitespace(html);

        expect(actual).toEqual('.is-readit-content{background-color:hotpink!important}');
    });

    it('renders a style tag with multiple CSS classes in it', function() {
        let node1 = getDefaultNode();

        let attributes2 = getDefaultAttributes();
        attributes2['@id'] = 'anotherUniqueId';
        attributes2['@type'] = [{'@id': 'rdfs:Class'}];
        delete attributes2['http://schema.org/color']
        let node2 = new Node(attributes2);

        let graph = new Graph([node1, node2]);
        let view = new CategoryColorsView({collection: graph});

        let html = view.render().$el.html();
        let actual = replaceNewLinesAndWhitespace(html);

        expect(actual).toEqual('.is-readit-content{background-color:hotpink!important}');
    });

    it('excludes linked data items that are irrelevant', function() {
        let node1 = getDefaultNode();

        let attributes2 = getDefaultAttributes();
        attributes2['@id'] = 'anotherUniqueId';
        attributes2['http://www.w3.org/2004/02/skos/core#prefLabel'] = [{'@value': 'Test2'}];
        attributes2['http://schema.org/color'] = [{'@value':'aliceblue'}];
        let node2 = new Node(attributes2);

        let graph = new Graph([node1, node2]);
        let view = new CategoryColorsView({collection: graph});

        let html = view.render().$el.html();
        let actual = replaceNewLinesAndWhitespace(html);

        expect(actual).toEqual('.is-readit-content{background-color:hotpink!important}.is-readit-test2{background-color:aliceblue!important}');
    });

    function replaceNewLinesAndWhitespace(text: string) {
        return text.replace(/(?:\r\n|\r|\n| )/g, "");
    }
});



