import { enableI18n, event } from '../test-util';

import View from '../core/view';
import { readit, rdfs, skos } from '../common-rdf/ns';
import { FlatLdObject } from '../common-rdf/json';
import Node from '../common-rdf/node';
import FlatItem from '../common-adapters/flat-item-model';

import attachTooltip, { Tooltip } from './tooltip-view';

function getDefaultAttributes(): FlatLdObject {
    return {
        '@id': readit('test'),
        "@type": [rdfs.Class],
        [skos.prefLabel]: [
            { '@value': 'Content' },
        ],
        [skos.altLabel]: [
            { '@value': 'alternativeLabel' }
        ],
        [skos.definition]: [
            { '@value': 'This is a test definition' }
        ],
        [rdfs.comment]: [
            { '@value': 'Also, I have a comment' }
        ],
    }
}

function getDefaultItem(): FlatItem {
    return new FlatItem(new Node(getDefaultAttributes()));
}

describe('Tooltip', function () {
    beforeAll(enableI18n);

    beforeEach(function() {
        this.item = getDefaultItem();
        this.substrate = new View();
        this.substrate.$el
        .html('<ul><li>A<li id=x>B<li>C</ul>')
        .appendTo(document.body);
    });

    afterEach(function() {
        this.substrate.remove();
    });

    it('includes the definition if it exists', async function () {
        const view = new Tooltip({ model: this.item });
        await event(this.item, 'complete');
        expect(view.el).toHaveClass('tooltip');
        expect(view.$el.data('tooltip')).toEqual('This is a test definition');
    });

    it('uses rdfs:comment otherwise', async function() {
        this.item.underlying.unset(skos.definition);
        const view = new Tooltip({ model: this.item });
        await event(this.item, 'complete');
        expect(view.el).toHaveClass('tooltip');
        expect(view.$el.data('tooltip')).toEqual('Also, I have a comment');
    });

    it('disables itself when definition and comment are absent', async function() {
        this.item.underlying.unset(skos.definition);
        this.item.underlying.unset(rdfs.comment);
        const view = new Tooltip({ model: this.item });
        await event(this.item, 'complete');
        expect(view.$el.data('tooltip')).not.toBeDefined();
        expect(view.el).not.toHaveClass('tooltip');
    });

    it('can be attached to another view', function() {
        const view = attachTooltip(this.substrate, {model: this.item});
        spyOn(view, 'remove').and.callThrough();
        expect(view.el).not.toHaveClass('is-tooltip-active');
        this.substrate.$el.trigger('mouseenter');
        expect(view.el).toHaveClass('is-tooltip-active');
        expect(view.$el.offset()).toEqual(this.substrate.$el.offset());
        expect(view.$el.width()).toEqual(this.substrate.$el.width());
        expect(view.$el.height()).toEqual(this.substrate.$el.height());
        this.substrate.$el.trigger('mouseleave');
        expect(view.el).not.toHaveClass('is-tooltip-active');
        expect(view.remove).not.toHaveBeenCalled();
        this.substrate.remove();
        expect(view.remove).toHaveBeenCalled();
    });
});
