import FilteredCollection from '../common-adapters/filtered-collection';
import FlatItemCollection from '../common-adapters/flat-item-collection';
import FlatItem from '../common-adapters/flat-item-model';
import Graph from '../common-rdf/graph';
import mockTieredOntology from '../mock-data/mock-tiered-ontology';
import { isAnnotationCategory } from '../utilities/linked-data-utilities';
import PickerView from './ontology-class-picker-view';


describe('OntologyClassPickerView', function() {
    beforeAll(function() {
        this.ontology = new FlatItemCollection(new Graph(mockTieredOntology));
        this.filtered = new FilteredCollection<FlatItem>(
            this.ontology,
            isAnnotationCategory,
        );
    });

    it('can be constructed in isolation', function() {
        const view = new PickerView({ collection: this.filtered });
        view.render();
        expect(view.$('.dropdown-content').children().length).toBe(2);
    });
});
