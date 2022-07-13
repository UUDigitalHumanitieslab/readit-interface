import { $ } from 'backbone';

import { startStore, endStore, event, onlyIf } from '../test-util';
import loremIpsum from '../lorem-ipsum';
import mockOntology from '../mock-data/mock-ontology';
import mockItems from '../mock-data/mock-items';

import Graph from '../common-rdf/graph';
import FlatCollection from '../common-adapters/flat-annotation-collection';
import SegmentCollection from '../highlight/text-segment-collection';
import HighlightLayer from './highlight-layer-view';

describe('HighlighLayerView', function() {
    const it = onlyIf(document.createRange().getClientRects, 'This suite needs Range support.');

    beforeAll(startStore);

    beforeAll(async function() {
        this.text = $('<pre>').text(loremIpsum).width('70ex').appendTo('body');
        this.ontology = new Graph(mockOntology);
        this.items = new Graph(mockItems);
        this.flat = new FlatCollection(this.items);
        this.segments = new SegmentCollection(this.flat);
        await event(this.flat, 'complete:all');
    });

    beforeEach(function() {
        this.view = new HighlightLayer({
            collection: this.segments,
            textContainer: this.text,
        });
    });

    afterEach(function() {
        this.view.remove();
    });

    afterAll(function() {
        this.text.remove();
    });

    afterAll(endStore);

    it('can be constructed', function() {
        expect(this.view).toBeDefined();
    });

    it('renders', function() {
        this.view.render();
        const items = this.view.items;
        const children = this.view.$el.children();
        expect(items.length).toBe(9);
        expect(children.length).toBe(9)
        const subItems = items[1].items;
        const grandChildren = children.eq(1).children();
        const childLength = grandChildren.length;
        expect(subItems.length).toBe(childLength);
        expect(childLength).toBeGreaterThan(0);
        expect(subItems[0].items.length).toBe(2);
        expect(grandChildren.eq(0).children().length).toBe(2);
    });

    it('renders idempotently', function() {
        this.view.render();
        spyOn(this.view, 'initItems');
        this.view.render();
        expect(this.view.initItems).not.toHaveBeenCalled();
    });

    it('bubbles child view events', function() {
        const spy = jasmine.createSpy('bubbled');
        this.view.render().on('all', spy);
        this.view.items[1].$el.click();
        expect(spy).toHaveBeenCalled();
    });
});
