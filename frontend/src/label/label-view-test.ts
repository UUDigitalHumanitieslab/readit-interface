import { enableI18n, event } from '../test-util';

import { readit, rdfs, skos } from './../common-rdf/ns';
import { FlatLdObject } from '../common-rdf/json';
import Node from '../common-rdf/node';
import LabelView from './label-view';
import FlatItem from '../common-adapters/flat-item-model';

function getDefaultItem(): FlatItem {
    return new FlatItem(new Node(getDefaultAttributes()));
}

function getDefaultAttributes(): FlatLdObject {
    return {
        '@id': readit('test'),
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

    beforeEach( async function() {
        this.item = getDefaultItem();

    });

    it('includes a tooltip if a definition exists', async function () {
        let view = new LabelView({ model: this.item });
        await event(this.item, 'complete');
        expect(view.el.className).toContain('is-readit-content');
        expect(view.$el.attr('data-tooltip')).toEqual('This is a test definition');
    });

    it('does not include a tooltip if a definition does not exist', async function () {
        let attributes = getDefaultAttributes();
        delete attributes[skos.definition]; 
        let view = new LabelView({ model: new FlatItem(new Node(attributes))});
        await event(view.model, 'complete');
        expect(view.el.className).toContain('is-readit-content');
        expect(view.$el.attr('data-tooltip')).toBeUndefined();
    });

    it('excludes a tooltip if told so', async function () {
        let view = new LabelView({ model: this.item, toolTipSetting: false });
        await event(this.item, 'complete');
        expect(view.el.className).toContain('is-readit-content');
        expect(view.$el.attr('data-tooltip')).toBeUndefined();
    });
})
