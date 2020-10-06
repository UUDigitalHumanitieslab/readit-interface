import { $ } from 'backbone';

import { onlyIf } from '../../test-util';

import { oa } from '../../jsonld/ns';
import Node from '../../jsonld/node';
import FlatItem from '../../annotation/flat-item-model';
import SnippetView from './snippet-view';

const selectorAttributes = {
    '@id': 'x',
    '@type': oa.TextQuoteSelector,
    [oa.prefix]: 'This is ',
    [oa.exact]: 'a text',
    [oa.suffix]: '.',
};

describe('SnippetView', function() {
    const it = onlyIf(document.createElement('canvas').getContext('2d'), 'This suite depends on the <canvas> element.');

    beforeEach(function() {
        this.selector = new Node(selectorAttributes);
        this.flat = new FlatItem(this.selector);
    });

    it('should not enter an infinite loop', function(done) {
        const el = $('<div class=snippet>').width(30);
        const snippet = new SnippetView({ el, model: this.flat });
        snippet.$el.ready(() => setTimeout(() => {
            snippet.remove();
            done();
        }));
        el.appendTo('body');
        // Prevent a warning about the spec having no expectations.
        expect(true).toBe(true);
    });
});
