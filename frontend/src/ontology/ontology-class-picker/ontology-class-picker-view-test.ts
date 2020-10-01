import mockOntology from '../../mock-data/mock-ontology';

import Node from '../../jsonld/node';
import Graph from '../../jsonld/graph';
import FilteredCollection from '../../utilities/filtered-collection';
import { isRdfsClass } from '../../utilities/utilities';
import PickerView from './ontology-class-picker-view';

describe('OntologyClassPickerView', function() {
    beforeAll(function() {
        this.ontology = new Graph(mockOntology);
        this.filtered = new FilteredCollection<Node, Graph>(
            this.ontology,
            isRdfsClass,
        );
    });

    it('can be constructed in isolation', function() {
        const view = new PickerView({ collection: this.filtered });
        view.render();
        expect(view.$('.dropdown-content').children().length).toBe(4);
    });
});
