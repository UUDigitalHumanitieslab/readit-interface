import { constant } from 'lodash';

import { enableI18n, startStore, endStore, event } from '../test-util';
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

    it('can be constructed in isolation', async function() {
        const view = new Dropdown();
        await event(view.typeGroup.collection, 'complete:all');
        expect(view.$('select optgroup').length).toBe(2);
        expect(view.$('optgroup:first-child').prop('label')).toBe('apply logic');
        expect(view.$('optgroup:first-child option').length).toBe(3);
        expect(view.$('optgroup:nth-child(2)').prop('label')).toBe('expect type');
        expect(view.$('optgroup:nth-child(2) option').length).toBe(3);
        expect(view.$('optgroup:nth-child(2)').text()).toContain('Reader');
        expect(view.$('optgroup:nth-child(2)').text()).not.toContain('Person');
    });
});
