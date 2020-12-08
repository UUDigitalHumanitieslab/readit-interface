import { enableI18n } from '../test-util';

import Graph from '../core/graph';
import Node from '../core/node';
import { FlatLdObject } from '../core/json';
import { rdfs, skos, schema } from '../core/ns';
import CategoryColorsView from './category-colors-view';

function getDefaultNode(): Node {
    return new Node(getDefaultAttributes());
}

function getDefaultAttributes(): FlatLdObject {
    return {
        '@id': '1',
        '@type': [
            rdfs.Class,
        ],
        [skos.prefLabel]: [
            { '@value': 'Content' },
        ],
        [skos.definition]: [
            { '@value': 'This is a test definition'}
        ],
        [schema.color]: [
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

        expect(this.view.collectColors()[0]).toEqual(expected);
    });

    it('renders a HTML style tag with some CSS in it', function() {
        expect(this.view.$el.prop("tagName")).toEqual('STYLE');

        let html = this.view.$el.html();
        let actual = replaceNewLinesAndWhitespace(html);

        expect(actual).toEqual('.is-readit-content{background-color:hotpink!important;}.hide-is-readit-content.is-readit-content,.hide-rit-any:not(.unhide-is-readit-content).is-readit-content{display:none!important;}');
    });

    it('renders a style tag with multiple CSS classes in it', function() {
        let node1 = getDefaultNode();

        let attributes2 = getDefaultAttributes();
        attributes2['@id'] = 'anotherUniqueId';
        attributes2['@type'] = [rdfs.Class];
        delete attributes2[schema.color]
        let node2 = new Node(attributes2);

        let graph = new Graph([node1, node2]);
        let view = new CategoryColorsView({collection: graph});

        let html = view.$el.html();
        let actual = replaceNewLinesAndWhitespace(html);

        expect(actual).toEqual('.is-readit-content{background-color:hotpink!important;}.hide-is-readit-content.is-readit-content,.hide-rit-any:not(.unhide-is-readit-content).is-readit-content{display:none!important;}');
    });

    it('excludes linked data items that are irrelevant', function() {
        let node1 = getDefaultNode();

        let attributes2 = getDefaultAttributes();
        attributes2['@id'] = 'anotherUniqueId';
        attributes2[skos.prefLabel] = [{'@value': 'Test2'}];
        attributes2[schema.color] = [{'@value':'aliceblue'}];
        let node2 = new Node(attributes2);

        let graph = new Graph([node1, node2]);
        let view = new CategoryColorsView({collection: graph});

        let html = view.$el.html();
        let actual = replaceNewLinesAndWhitespace(html);

        expect(actual).toEqual('.is-readit-content{background-color:hotpink!important;}.hide-is-readit-content.is-readit-content,.hide-rit-any:not(.unhide-is-readit-content).is-readit-content{display:none!important;}.is-readit-test2{background-color:aliceblue!important;}.hide-is-readit-test2.is-readit-test2,.hide-rit-any:not(.unhide-is-readit-test2).is-readit-test2{display:none!important;}');
    });

    it('is self-rendering and self-updating', function() {
        const originalHTML = this.view.$el.html();
        expect(originalHTML.length).toBeGreaterThan(0);

        const newClass = getDefaultAttributes();
        newClass['@id'] = '2';
        newClass[skos.prefLabel][0]['@value'] = 'giraffe';
        this.view.collection.add(newClass);
        const newHTML = this.view.$el.html();
        expect(newHTML.length).toBe(originalHTML.length * 2);
        expect(newHTML).toContain(originalHTML);
    });

    function replaceNewLinesAndWhitespace(text: string) {
        return text.replace(/(?:\r\n|\r|\n| )/g, "");
    }
});



