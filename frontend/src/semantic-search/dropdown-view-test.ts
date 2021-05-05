import { constant } from 'lodash';

import { enableI18n, startStore, endStore } from '../test-util';
import mockOntology from '../mock-data/mock-ontology';

import Model from '../core/model';
import ldChannel from '../common-rdf/radio';
import Graph from '../common-rdf/graph';

import Dropdown from './dropdown-view';

describe('semantic search DropdownView', function() {
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
        const view = new Dropdown();
        expect(view.$('select optgroup').length).toBe(2);
    });
});
