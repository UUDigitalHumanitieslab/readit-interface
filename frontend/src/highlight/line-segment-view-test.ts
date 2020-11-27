import { each } from 'lodash';

import { startStore, endStore, event } from '../test-util';
import mockOntology from '../mock-data/mock-ontology';
import mockItems from '../mock-data/mock-items';

import Model from '../core/model';
import Graph from '../core/graph';
import FlatCollection from '../core/flat-annotation-collection';
import LineSegment from './line-segment-view';

const positioning = {
    top: 1000,
    left: 2000,
    height: 24,
    width: 80,
};

describe('LineSegmentView', function() {
    beforeEach(startStore);
    beforeEach(function() {
        this.ontology = new Graph(mockOntology);
        this.items = new Graph();
        this.flat = new FlatCollection(this.items);
        this.position = new Model(positioning);
    });
    afterEach(endStore);

    it('is a very simple view that renders at creation time', async function() {
        this.items.add(mockItems);
        await event(this.flat, 'complete:all');
        this.lineSegment = new LineSegment({
            model: this.position,
            collection: this.flat,
        });
        each(positioning, (value, key) => {
            expect(this.lineSegment.$el.css(key)).toEqual(`${value}px`)
        });
        const colorBands = this.lineSegment.$el.children();
        expect(colorBands.length).toBe(this.flat.length);
        this.flat.each((model, index) => {
            expect(colorBands.get(index)).toHaveClass(model.get('cssClass'))
        });
    });
});
