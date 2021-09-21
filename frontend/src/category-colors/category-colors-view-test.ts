import { enableI18n } from '../test-util';

import Graph from '../common-rdf/graph';
import Node from '../common-rdf/node';
import { FlatLdObject } from '../common-rdf/json';
import { rdfs, skos, schema } from '../common-rdf/ns';
import { placeholderClass } from '../utilities/annotation-utilities';

import CategoryColorsView from './category-colors-view';

const fixedSuffix = `.is-readit-selection{background-color:${placeholderClass.get(schema.color)[0]}!important;}.hide-is-readit-selection.is-readit-selection,.hide-rit-any:not(.unhide-is-readit-selection).is-readit-selection{display:none!important;}.hide-rit-is-nlp.rit-is-nlp,.hide-rit-any:not(.unhide-rit-is-nlp).rit-is-nlp{display:none!important;}.hide-rit-is-semantic.rit-is-semantic,.hide-rit-any:not(.unhide-rit-is-semantic).rit-is-semantic{display:none!important;}.hide-rit-verified.rit-verified,.hide-rit-any:not(.unhide-rit-verified).rit-verified{display:none!important;}.hide-rit-unverified.rit-unverified,.hide-rit-any:not(.unhide-rit-unverified).rit-unverified{display:none!important;}.hide-rit-self-made.rit-self-made,.hide-rit-any:not(.unhide-rit-self-made).rit-self-made{display:none!important;}.hide-rit-other-made.rit-other-made,.hide-rit-any:not(.unhide-rit-other-made).rit-other-made{display:none!important;}`;

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
            { '@value': 'This is a test definition' }
        ],
        [schema.color]: [
            { '@value': 'hotpink' }
        ]
    }
}

describe('CategoryColorsView', function () {
    beforeAll(enableI18n);

    beforeEach(function () {
        let graph = new Graph([getDefaultNode()]);
        this.view = new CategoryColorsView({ collection: graph });
    });

    it('parses graphs into cssClass and color, appending the placeholder', function () {
        let expected = {
            class: 'is-readit-content',
            color: 'hotpink'
        };

        const colors = this.view.collectColors();
        expect(colors.length).toBe(8);
        expect(colors[0]).toEqual(expected);
    });

    it('renders a HTML style tag with some CSS in it', function () {
        expect(this.view.$el.prop("tagName")).toEqual('STYLE');

        let html = this.view.$el.html();
        let actual = replaceNewLinesAndWhitespace(html);

        expect(actual).toEqual('.is-readit-content{background-color:hotpink!important;}.hide-is-readit-content.is-readit-content,.hide-rit-any:not(.unhide-is-readit-content).is-readit-content{display:none!important;}' + fixedSuffix);
    });

    it('renders a style tag with multiple CSS classes in it', function () {
        let node1 = getDefaultNode();

        let attributes2 = getDefaultAttributes();
        attributes2['@id'] = 'anotherUniqueId';
        attributes2['@type'] = [rdfs.Class];
        delete attributes2[schema.color]
        let node2 = new Node(attributes2);

        let graph = new Graph([node1, node2]);
        let view = new CategoryColorsView({ collection: graph });

        let html = view.$el.html();
        let actual = replaceNewLinesAndWhitespace(html);

        expect(actual).toEqual('.is-readit-content{background-color:hotpink!important;}.hide-is-readit-content.is-readit-content,.hide-rit-any:not(.unhide-is-readit-content).is-readit-content{display:none!important;}' + fixedSuffix);
    });

    it('excludes linked data items that are irrelevant', function () {
        let node1 = getDefaultNode();

        let attributes2 = getDefaultAttributes();
        attributes2['@id'] = 'anotherUniqueId';
        attributes2[skos.prefLabel] = [{ '@value': 'Test2' }];
        attributes2[schema.color] = [{ '@value': 'aliceblue' }];
        let node2 = new Node(attributes2);

        let graph = new Graph([node1, node2]);
        let view = new CategoryColorsView({ collection: graph });

        let html = view.$el.html();
        let actual = replaceNewLinesAndWhitespace(html);

        expect(actual).toEqual('.is-readit-content{background-color:hotpink!important;}.hide-is-readit-content.is-readit-content,.hide-rit-any:not(.unhide-is-readit-content).is-readit-content{display:none!important;}.is-readit-test2{background-color:aliceblue!important;}.hide-is-readit-test2.is-readit-test2,.hide-rit-any:not(.unhide-is-readit-test2).is-readit-test2{display:none!important;}' + fixedSuffix);
    });

    it('is self-rendering and self-updating', function () {
        const originalHTML = replaceNewLinesAndWhitespace(this.view.$el.html());
        expect(originalHTML.length).toBeGreaterThan(0);

        const newClass = getDefaultAttributes();
        newClass['@id'] = '2';
        newClass[skos.prefLabel][0]['@value'] = 'giraffe';
        this.view.collection.add(newClass);
        const newHTML = replaceNewLinesAndWhitespace(this.view.$el.html());
        expect(newHTML.length).toBeGreaterThan(originalHTML.length);
        const originalPrefix = originalHTML.slice(0, -fixedSuffix.length);
        expect(newHTML).toContain(originalPrefix);
        expect(newHTML).toContain(fixedSuffix);
    });

    function replaceNewLinesAndWhitespace(text: string) {
        return text.replace(/(?:\r\n|\r|\n| )/g, "");
    }
});



