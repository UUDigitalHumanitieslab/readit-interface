import Graph from '../common-rdf/graph';
import FlatCollection from '../common-adapters/flat-annotation-collection';
import AnnoListPanel from './annotation-list-panel';
import FlatItem from '../common-adapters/flat-item-model';
import mockSources from '../mock-data/mock-sources';
import Node from '../common-rdf/node';

describe('AnnotationListPanel', function() {
    beforeEach(function() {
        this.items = new Graph();
        this.flat = new FlatCollection(this.items);
        const node = new Node(mockSources);
        this.model = new FlatItem(node);
    });

    it('can be constructed in isolation', function() {
        const view = new AnnoListPanel({ collection: this.flat, model: this.model });
        expect(view.$el.html()).toBeTruthy();
    });
});
