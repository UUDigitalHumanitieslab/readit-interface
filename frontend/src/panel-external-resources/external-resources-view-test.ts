import Node from '../core/node';

import ExternalResourcesView from './external-resources-view';
import { anno1ContentInstance } from '../mock-data/mock-items';

describe('ExternalResourcesView', function() {
    beforeEach(function() {
        this.model = new Node(anno1ContentInstance);
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
