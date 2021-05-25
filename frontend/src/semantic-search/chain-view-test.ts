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
    });

    afterEach(function() {
        ldChannel.stopReplying('ontology:graph');
    });

    afterEach(endStore);

    it('can be constructed in isolation', function() {
        const view = new Chain();
        expect(view.items.length).toBe(1);
        expect(view.items[0]['typeGroup']).toBeDefined();
        expect(view.items[0]['typeGroup'].collection.length).toBe(3);
    });

    it('can be constructed with a preselection', function() {
        const Reader = ldChannel.request('obtain', readit('Reader'));
        const view = new Chain({ model: Reader });
        expect(view.items.length).toBe(1);
        expect(view.items[0]['predicateGroup']).toBeDefined();
        expect(view.items[0]['predicateGroup'].collection.length).toBe(2);
    });

    it('appends dropdowns as choices are made', function() {
        const view = new Chain();
        const dropdown1 = view.items[0] as Dropdown;
        dropdown1.val(readit('Reader'));
        expect(view.items.length).toBe(2);
        const dropdown2 = view.items[1] as Dropdown;
        expect(dropdown2.predicateGroup).toBeDefined();
        expect(dropdown2.predicateGroup.collection.length).toBe(2);
    });
});
