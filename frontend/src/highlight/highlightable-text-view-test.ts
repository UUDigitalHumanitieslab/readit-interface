import { $ } from 'backbone';
import { noop } from 'lodash';

import Graph from '../jsonld/graph';
import FilteredCollection from '../utilities/filtered-collection';
import HighlightableTextView from './highlightable-text-view';
import { bigText } from './chunk-consistency-test';

const shortText = 'This is a short text';

// Common logic for the first two specs.
function testConstructor(text, expectPostInit, done) {
    const view = new HighlightableTextView({
        text: this.text,
        collection: this.filteredEmpty,
    });
    spyOn(view, 'initHighlights').and.callFake(() => {
        // This is executed at the end of the test.
        expect(view.$el.text()).toBe(text);
        expectPostInit(view);
        view.remove();
        done();
        return view;
    });
    $('body').append(view.el);
    expect(view.initHighlights).not.toHaveBeenCalled();
    jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        contentType: 'text/plain',
        responseText: text,
    });
}

describe('HighlightableTextView', function() {
    beforeEach(function() {
        jasmine.Ajax.install();
        this.text = $.get('http://example.test/text.txt');
        this.emptyAnno = new Graph();
        this.filteredEmpty = new FilteredCollection(this.emptyAnno, () => true);
    });

    afterEach(function() {
        jasmine.Ajax.uninstall();
    });

    it('can be constructed in isolation', function(done) {
        testConstructor.call(this, shortText, noop, done);
    });

    it('does not chunk the text even if it is long', function(done) {
        testConstructor.call(this, bigText, view => {
            expect(view.textWrapper.get(0).childNodes.length).toBe(1);
        }, done);
    });
});
