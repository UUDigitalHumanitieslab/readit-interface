import { $ } from 'backbone';
import { noop } from 'lodash';

import Graph from '../jsonld/graph';
import FlatCollection from '../annotation/flat-annotation-collection';
import SegmentCollection from '../highlight/text-segment-collection';
import HighlightableTextView from './highlightable-text-view';
import { bigText } from '../highlight/chunk-consistency-test';

const shortText = 'This is a short text';

// Common logic for the first two specs.
function testConstructor(text, expectPostInit) {
    const view = new HighlightableTextView({
        text,
        collection: this.segments,
    });
    $('body').append(view.el);
    view.render().activate();
    expect(view.$el.text()).toBe(text);
    expectPostInit(view);
    view.remove();
}

describe('HighlightableTextView', function() {
    beforeEach(function() {
        this.items = new Graph();
        this.flat = new FlatCollection(this.items);
        this.segments = new SegmentCollection(this.flat);
    });

    it('can be constructed in isolation', function() {
        testConstructor.call(this, shortText, noop);
    });

    it('does not chunk the text even if it is long', function() {
        testConstructor.call(this, bigText, view => {
            expect(view.textWrapper.get(0).childNodes.length).toBe(1);
        });
    });

    describe('subviews', function() {
        it('returns a nonempty list', function() {
            testConstructor.call(this, shortText, view => {
                expect(view.subviews()).toEqual([{
                    view: 'highlightLayer',
                    selector: '.position-container',
                    method: 'prepend',
                }]);
            });
        });
    });
});
