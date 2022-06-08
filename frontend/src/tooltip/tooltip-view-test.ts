import { each } from 'lodash';

import { enableI18n } from '../test-util';

import fastTimeout from '../core/fastTimeout';
import Model from '../core/model';
import View from '../core/view';

import attachTooltip, { Tooltip } from './tooltip-view';

function getDefaultAttributes() {
    return {
        text: 'This is a test tooltip text',
    }
}

function getDefaultModel() {
    return new Model(getDefaultAttributes());
}

describe('Tooltip', function () {
    beforeAll(enableI18n);

    beforeEach(function() {
        this.model = getDefaultModel();
        this.substrate = new View();
        this.substrate.$el
        .html('<ul><li>A<li id=x>B<li>C</ul>')
        .appendTo(document.body);
    });

    afterEach(function() {
        this.substrate.remove();
    });

    it('uses the text attribute of the model', async function () {
        const view = new Tooltip({ model: this.model });
        // The `Tooltip` invokes `this.model.when`, which in turn invokes
        // `fastTimeout`. This is faster than a regular `window.setTimeout`, but
        // slower than a `Promise`. Hence, we await a `fastTimeout` to ensure
        // that things have settled down.
        await new Promise(fastTimeout);
        expect(view.el).toHaveClass('tooltip');
        expect(view.$el.data('tooltip')).toEqual('This is a test tooltip text');
    });

    it('disables itself when text is absent', function() {
        this.model.unset('text');
        const view = new Tooltip({ model: this.model });
        expect(view.$el.data('tooltip')).not.toBeDefined();
        expect(view.el).not.toHaveClass('tooltip');
    });

    it('can be attached to another view', function() {
        const view = attachTooltip(this.substrate, {model: this.model});
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

    it('can be attached to multiple subelements of another view', function() {
        const v1 = attachTooltip(this.substrate, {model: this.model}, 'ul');
        const v2 = attachTooltip(this.substrate, {model: this.model}, 'li:first-child');
        const v3 = attachTooltip(this.substrate, {model: this.model}, '#x');
        const e3 = this.substrate.$('#x');
        each([v1, v2, v3], view => spyOn(view, 'remove').and.callThrough());
        const expectActive = (active, inactive) => {
            each(active, v => expect(v.el).toHaveClass('is-tooltip-active'));
            each(inactive, v => expect(v.el).not.toHaveClass('is-tooltip-active'));
        };
        this.substrate.$el.trigger('mouseenter');
        expectActive([], [v1, v2, v3]);
        this.substrate.$('ul').trigger('mouseenter');
        expectActive([v1], [v2, v3]);
        this.substrate.$('li:first-child').trigger('mouseenter');
        expectActive([v1, v2], [v3]);
        this.substrate.$('li:first-child').trigger('mouseleave');
        this.substrate.$('li:nth-child(2)').trigger('mouseenter');
        expectActive([v1, v3], [v2]);
        each(['offset', 'width', 'height'], dimension =>
            expect(v3.$el[dimension]()).toEqual(e3[dimension]())
        );
        this.substrate.$('li:nth-child(2)').trigger('mouseleave');
        // We don't specify an expectation for v1 on the next line, because
        // jQuery's .trigger method treats 'mouseenter' and 'mouseleave' as
        // regular bubbling events, unlike what we expect with real mouse
        // pointer interactions. Hence, we would "naturally" expect `v1` to be
        // active, but in this spec, it would be inactive. Fortunately, it does
        // not matter whether the test is accurate or not in this regard; it is
        // reasonable to expect elements with tooltips to be disjoint.
        expectActive([], [v2, v3]);
        this.substrate.$('ul').trigger('mouseleave');
        expectActive([], [v1, v2, v3]);
        this.substrate.remove();
        each([v1, v2, v3], v => expect(v.remove).toHaveBeenCalled());
    });
});
