import { enableI18n, event } from '../test-util';

import { readit, rdfs, skos } from './../common-rdf/ns';
import { FlatLdObject } from '../common-rdf/json';
import Subject from '../common-rdf/subject';
import FlatItem from '../common-adapters/flat-item-model';

import LabelView from './label-view';

function getDefaultItem(): FlatItem {
    return new FlatItem(new Subject(getDefaultAttributes()));
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
        ],
    };
}

describe('LabelView', function () {
    beforeAll(enableI18n);

    beforeEach( async function() {
        this.item = getDefaultItem();

    });

    it('can be constructed in isolation', async function () {
        let view = new LabelView({ model: this.item });
        await event(this.item, 'complete');
        expect(view.el.className).toContain('is-readit-content');
    });

    it('excludes a tooltip if told so', async function () {
        let view = new LabelView({ model: this.item, toolTipSetting: false });
        await event(this.item, 'complete');
        expect(view.el.className).toContain('is-readit-content');
    });
});
