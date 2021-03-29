import { enableI18n } from '../test-util';

import { rdfs, skos } from './../common-rdf/ns';
import { FlatLdObject } from '../common-rdf/json';
import Node from '../common-rdf/node';
import LabelView from './label-view';
import FlatItem from '../common-adapters/flat-item-model';

function getDefaultItem(): FlatItem {
    return new FlatItem(new Node(getDefaultAttributes()));
}

function getDefaultAttributes(): FlatLdObject {
    return {
        '@id': 'uniqueID',
        "@type": [rdfs.Class],
        [skos.prefLabel]: [
            { '@value': 'Content' },
        ],
        [skos.altLabel]: [
            { '@value': 'alternativeLabel'}
        ],
        [skos.definition]: [
            { '@value': 'This is a test definition'}
        ]
    }
}

describe('LabelView', function () {
    beforeAll(enableI18n);

    it('includes a tooltip if a definition exists', function () {
        let item = getDefaultItem();
        let view = new LabelView({ model: item });
        expect(view.el.className).toContain('is-readit-content');
        expect(view.$el.attr('data-tooltip')).toEqual('This is a test definition');
    });

    it('does not include a tooltip if a definition does not exist', function () {
        let attributes = getDefaultAttributes();
        delete attributes[skos.definition];
        let item = new FlatItem(new Node(attributes));

        let view = new LabelView({ model: item });

        expect(view.el.className).toContain('is-readit-content');
        expect(view.$el.attr('data-tooltip')).toBeUndefined();
    });

    it('excludes a tooltip if told so', function () {
        let item = getDefaultItem();
        let view = new LabelView({ model: item, toolTipSetting: false });

        expect(view.el.className).toContain('is-readit-content');
        expect(view.$el.attr('data-tooltip')).toBeUndefined();
    });
})
