import { constant } from 'lodash';

import { enableI18n, startStore, endStore, event } from '../test-util';
import mockOntology from '../mock-data/mock-ontology';

import ldChannel from '../common-rdf/radio';
import { readit } from '../common-rdf/ns';
import Graph from '../common-rdf/graph';

import Dropdown from './dropdown-view';
import Chain from './chain-view';

describe('semantic search ChainView', function() {
    beforeAll(enableI18n);
    beforeEach(startStore);

    beforeEach(function() {
        const ontology = new Graph(mockOntology);
        ldChannel.reply('ontology:graph', constant(ontology));
        ldChannel.reply(
            'ontology:promise', constant(Promise.resolve(ontology))
        );
    });

    afterEach(function() {
        ldChannel.stopReplying('ontology:graph');
        ldChannel.stopReplying('ontology:promise');
    });

    afterEach(endStore);

    it('can be constructed in isolation', async function() {
        const view = new Chain();
        expect(view.items.length).toBe(1);
        await event(view.items[0], 'ready');
        expect(view.items[0]['typeGroup']).toBeDefined();
        expect(view.items[0]['typeGroup'].collection.length).toBe(3);
    });

    it('can be constructed with a preselection', async function() {
        const Reader = ldChannel.request('obtain', readit('Reader'));
        const view = new Chain({ model: Reader });
        expect(view.items.length).toBe(1);
        await event(view.items[0], 'ready');
        expect(view.items[0]['predicateGroup']).toBeDefined();
        expect(view.items[0]['predicateGroup'].collection.length).toBe(2);
    });

    it('appends dropdowns as choices are made', async function() {
        const view = new Chain();
        const dropdown1 = view.items[0] as Dropdown;
        await event(dropdown1, 'ready');
        dropdown1.val(readit('Reader'));
        expect(view.items.length).toBe(2);
        const dropdown2 = view.items[1] as Dropdown;
        await event(dropdown2, 'ready');
        expect(dropdown2.predicateGroup).toBeDefined();
        expect(dropdown2.predicateGroup.collection.length).toBe(2);
    });
});
