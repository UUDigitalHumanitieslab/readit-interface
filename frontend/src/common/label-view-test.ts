import { enableI18n } from '../test-util';

import { JsonLdObject } from './../jsonld/json';
import Node from './../jsonld/node';
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

        let classList = view.render().el.className;

        expect(classList).toContain('tag');
        expect(classList).toContain('is-readit-test');

        expect(view.render().$el.prop("tagName")).toEqual('SPAN');
    });

    it('includes a tooltip', function () {
        let attributes: JsonLdObject = {
            '@id': 'uniqueID',
            '@type': 'rdfs:Class',
            'skos:prefLabel': 'test',
            'classDefinition': 'This is a test definition',
        }

        let node = new Node(attributes);
        let view = new LabelView({ model: node });

        let classList = view.render().$el[0].classList;

        expect(classList).toContain('tooltip');
        expect(classList).toContain('is-tooltip-right');
        expect(classList).toContain('is-tooltip-multiline');
        expect(view.render().$el.attr('data-tooltip')).toEqual('This is a test definition');
    });
})
