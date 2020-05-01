import Graph from '../jsonld/graph';
import FlatCollection from './flat-annotation-collection';
import AnnoListPanel from './panel-annotation-list-view';

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
