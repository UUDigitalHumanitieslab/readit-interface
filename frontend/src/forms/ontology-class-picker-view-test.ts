import mockOntology from '../mock-data/mock-ontology';

import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';
import FilteredCollection from '../common-adapters/filtered-collection';
import { isRdfsClass } from '../utilities/linked-data-utilities';
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
