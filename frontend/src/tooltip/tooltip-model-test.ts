import { enableI18n, event } from '../test-util';

import { readit, rdfs, skos } from '../common-rdf/ns';
import { FlatLdObject } from '../common-rdf/json';
import Node from '../common-rdf/node';
import FlatItem from '../common-adapters/flat-item-model';

import toTooltip from './tooltip-model';

function getDefaultAttributes(): FlatLdObject {
    return {
        '@id': readit('test'),
        "@type": [rdfs.Class],
        [skos.prefLabel]: [
            { '@value': 'Content' },
        ],
        [skos.altLabel]: [
            { '@value': 'alternativeLabel' }
        ],
        [skos.definition]: [
            { '@value': 'This is a test definition' }
        ],
        [rdfs.comment]: [
            { '@value': 'Also, I have a comment' }
        ],
    }
}

function getDefaultItem(): FlatItem {
    return new FlatItem(new Node(getDefaultAttributes()));
}

describe('Tooltip model adapter', function () {
    beforeAll(enableI18n);

    beforeEach(function() {
        this.item = getDefaultItem();
    });

    it('uses skos:definition if available', async function () {
        const model = toTooltip(this.item);
        await event(this.item, 'complete');
        expect(model.get('text')).toEqual('This is a test definition');
    });

    it('uses rdfs:comment otherwise', async function() {
        this.item.underlying.unset(skos.definition);
        const model = toTooltip(this.item);
        await event(this.item, 'complete');
        expect(model.get('text')).toEqual('Also, I have a comment');
    });

    it('unsets the text when definition and comment are absent', async function() {
        this.item.underlying.unset(skos.definition);
        this.item.underlying.unset(rdfs.comment);
        const model = toTooltip(this.item);
        await event(this.item, 'complete');
        expect(model.has('text')).toBe(false);
    });
});
