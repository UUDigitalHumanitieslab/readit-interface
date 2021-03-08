import Graph from '../common-rdf/graph';
import FlatCollection from '../common-adapters/flat-annotation-collection';
import AnnoListPanel from './annotation-list-panel';

describe('AnnotationListPanel', function() {
    beforeEach(function() {
        this.items = new Graph();
        this.flat = new FlatCollection(this.items);
    });

    it('can be constructed in isolation', function() {
        const view = new AnnoListPanel({ collection: this.flat });
        expect(view.$el.html()).toBeTruthy();
    });
});
