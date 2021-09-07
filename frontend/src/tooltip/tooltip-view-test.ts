import { enableI18n, event } from '../test-util';

import { readit, rdfs, skos } from './../common-rdf/ns';
import { FlatLdObject } from '../common-rdf/json';
import Node from '../common-rdf/node';
import FlatItem from '../common-adapters/flat-item-model';

import { Tooltip } from './tooltip-view';

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

describe('Tooltip', function () {
    beforeAll(enableI18n);

    beforeEach( async function() {
        this.item = getDefaultItem();

    });

    it('includes the definition if it exists', async function () {
        let view = new Tooltip({ model: this.item });
        await event(this.item, 'complete');
        expect(view.$el.data('tooltip')).toEqual('This is a test definition');
    });
});
