import Graph from '../common-rdf/graph';
import FlatCollection from '../common-adapters/flat-annotation-collection';
import AnnoListView from './annotation-list-view';

describe('AnnotationListPanel', function() {
    beforeEach(function() {
        this.items = new Graph();
        this.flat = new FlatCollection(this.items);
    });

    it('can be constructed in isolation', function() {
        const view = new AnnoListView({ collection: this.flat });
        expect(view.$el.html()).toBeTruthy();
    });
});