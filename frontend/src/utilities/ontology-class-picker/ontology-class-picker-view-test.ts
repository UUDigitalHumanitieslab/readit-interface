import mockOntology from '../../mock-data/mock-ontology';

import Graph from '../../jsonld/graph';
import PickerView from './ontology-class-picker-view';

describe('OntologyClassPickerView', function() {
    beforeAll(function() {
        this.ontology = new Graph(mockOntology);
    });

    it('can be constructed in isolation', function() {
        const view = new PickerView({ collection: this.ontology });
        view.render();
        expect(view.$('.dropdown-content').children().length).toBe(4);
    });
});
