import Node from '../jsonld/node';

import ExternalResourcesView from './external-resources-view';
import anno1Instance from '../mock-data/mock-items';

describe('ExternalResourcesView', function() {
    beforeEach(function() {
        this.model = new Node(anno1Instance);
    });

    it('can be constructed in isolation', function() {
        const view = new ExternalResourcesView({ model: this.model });
        expect(view.$el.html()).toBeTruthy();
    });

    it('renders a list of external resource labels and urls', function() {
        const view = new ExternalResourcesView({ model: this.model });
        expect(view.externalResources).toBeTruthy();
    });
});
