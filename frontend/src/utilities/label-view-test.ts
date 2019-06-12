import { enableI18n } from '../test-util';

import { JsonLdObject } from '../jsonld/json';
import Node from '../jsonld/node';
import LabelView from './label-view';

function getDefaultNode(): Node {
    return new Node(getDefaultAttributes());
}

function getDefaultAttributes(): JsonLdObject {
    return {
        '@id': 'uniqueID',
        "@type": [
            { '@id': "rdfs:Class" }
        ],
        'http://www.w3.org/2004/02/skos/core#prefLabel': [
            { '@value': 'Content' },
        ],
        'http://www.w3.org/2004/02/skos/core#altLabel': [
            { '@value': 'alternativeLabel'}
        ],
        'http://www.w3.org/2004/02/skos/core#definition': [
            { '@value': 'This is a test definition'}
        ]
    }
}

describe('LabelView', function () {
    beforeAll(enableI18n);

    it('includes a tooltip if a definition exists', function () {
        let node = getDefaultNode();
        let view = new LabelView({ model: node });

        expect(view.render().el.className).toContain('is-readit-content');
        expect(view.render().$el.attr('data-tooltip')).toEqual('This is a test definition');
    });

    it('does not include a tooltip if a definition does not exists', function () {
        let attributes = getDefaultAttributes();
        delete attributes['http://www.w3.org/2004/02/skos/core#definition'];
        let node = new Node(attributes);

        let view = new LabelView({ model: node });

        expect(view.render().el.className).toContain('is-readit-content');
        expect(view.render().$el.attr('data-tooltip')).toBeUndefined();
    });

    it('excludes a tooltip if told so', function () {
        let node = getDefaultNode();
        let view = new LabelView({ model: node }, false);

        expect(view.render().el.className).toContain('is-readit-content');
        expect(view.render().$el.attr('data-tooltip')).toBeUndefined();
    });
})
