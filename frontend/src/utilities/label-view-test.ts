import { enableI18n } from '../test-util';

import { JsonLdObject } from '../jsonld/json';
import Node from '../jsonld/node';
import LabelView from './label-view';

describe('LabelView', function () {
    beforeAll(enableI18n);

    it('renders a span with class tag', function () {
        let attributes: JsonLdObject = {
            '@id': 'uniqueID',
            '@type': 'rdfs:Class',
            'skos:prefLabel': 'test',
        }

        let node = new Node(attributes);
        let view = new LabelView({ model: node });

        expect(view.render().el.className).toContain('tag');
        expect(view.render().$el.prop("tagName")).toEqual('SPAN');
    });

    it('includes a tooltip', function () {
        let attributes: JsonLdObject = {
            '@id': 'uniqueID',
            '@type': 'rdfs:Class',
            'skos:prefLabel': 'test',
            'skos:definition': 'This is a test definition',
        }

        let node = new Node(attributes);
        let view = new LabelView({ model: node });

        expect(view.render().$el.prop("tagName")).toEqual('SPAN');
        expect(view.render().el.className).toEqual('tag tooltip is-tooltip-right is-tooltip-multiline is-readit-test');
        expect(view.render().$el.attr('data-tooltip')).toEqual('This is a test definition');
    });
})
