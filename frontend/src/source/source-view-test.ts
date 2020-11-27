import { $ } from 'backbone';
import { pick } from 'lodash';

import { startStore, endStore } from '../test-util';
import mockSources from '../mock-data/mock-sources';

import { schema, vocab } from '../core/ns';
import Node from '../core/node';
import Graph from '../core/graph';
import FlatCollection from '../core/flat-annotation-collection';
import SourcePanel from './source-view';

const textURI = 'http://test.test/test.txt';

describe('SourceView', function() {
    beforeEach(startStore);
    beforeEach(function() {
        this.source = new Node(mockSources[0]);
        this.items = new Graph();
        this.flat = new FlatCollection(this.items);
    });
    afterEach(endStore);

    it('can be constructed in isolation', function() {
        const view = new SourcePanel({
            model: this.source,
            collection: this.flat,
        });
        expect(view.isEditable).toBe(false);
        expect(view.isShowingHighlights).toBe(false);
        expect(view.toolbar).toBeDefined();
        expect(view._triggerHighlighting).toBeDefined();
        view.remove();
    });

    it('will start rendering highlights eventually', function(done) {
        // Change `this.source` to provide the text as an URI instead of
        // containing the text inline.
        const text = this.source.get(schema.text)[0];
        this.source.unset(schema.text).set(vocab('fullText'), textURI);

        // This will cause the source panel to request the text with an XHR.
        const view = new SourcePanel({
            model: this.source,
            collection: this.flat,
        });
        // No text, no highlightable text view.
        expect(view.htv).not.toBeDefined();

        // First required trigger: text is available.
        setTimeout(() => {
            jasmine.Ajax.requests.mostRecent().respondWith({
                status: 200,
                contentType: 'text/plain',
                responseText: text,
            });

            // XHR response is handled async, but since the response itself was
            // produced sync, the callback is already queued at this point. Just
            // a small delay (5 ms below) is enough to ensure that the next
            // block of code runs after it.
            setTimeout(() => {

                // The presence of the highlightable text view by itself only
                // depends on the text and not on the other triggers.
                expect(view.htv).toBeDefined();
                expect(view.htv.highlightLayer).toBeDefined();

                // Second required trigger: all annotations are complete.
                this.flat.trigger('complete:all');
                expect(view.htv.highlightLayer.$el.children().length).toBe(0);

                // Third requried trigger: view is attached to the `document`.
                $('body').append(view.el);
                view.activate();
                expect(view.htv.highlightLayer.$el.children().length).toBe(1);
                view.remove();
                done();
            }, 5);
        });
    });

    it('can handle incomplete information', function() {
        const incomplete = pick(mockSources[0], '@id');
        this.source.clear().set(incomplete);
        expect(() => new SourcePanel({
            model: this.source,
            collection: this.flat,
        })).not.toThrow();
    });
});
