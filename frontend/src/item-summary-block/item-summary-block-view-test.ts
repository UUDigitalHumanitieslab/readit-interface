import { startStore, endStore, event } from '../test-util';
import mockOntology from '../mock-data/mock-ontology';
import mockItems from '../mock-data/mock-items';

import Node from '../core/node';
import Graph from '../core/graph';
import FlatItem from '../core/flat-item-model';
import FlatCollection from '../core/flat-annotation-collection';
import ItemSummaryBlock from './item-summary-block-view';

function expectSuccessfulRender(view: ItemSummaryBlock) {
    const text = view.$el.text();
    expect(text).toContain('The Idler in France');
    expect(text).toContain('(Content)');
    expect(view.el).toHaveClass('is-readit-content');
}

describe('ItemSummaryBlock', function() {
    beforeEach(startStore);

    beforeEach(function() {
        this.ontology = new Graph(mockOntology);
        this.items = new Graph(mockItems.slice(0, 5));
        this.flat = new FlatCollection(this.items);
    });

    afterEach(endStore);

    it('can be constructed with a flat annotation', async function() {
        const view = new ItemSummaryBlock({ model: this.flat.at(0) });
        await event(view.model, 'complete');
        expectSuccessfulRender(view);
    });

    it('can be constructed with an oa:Annotation', async function() {
        const view = new ItemSummaryBlock({ model: this.items.at(0) });
        await event(view.model, 'complete');
        expectSuccessfulRender(view);
    });

    it('can be constructed with an ontology class instance', function() {
        const view = new ItemSummaryBlock({ model: this.items.at(1) });
        expectSuccessfulRender(view);
    });
});
