import { extend, constant } from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import View from '../core/view';
import explorerChannel from '../explorer/explorer-radio';

import createFilterView from './filter-view';

export const fakeHierarchy = new Collection([{
    model: new Model({ label: 'a' }),
}, {
    model: new Model({ label: 'b' }),
    collection: new Collection([{
        model: new Model({ label: 'c' }),
    }, {
        model: new Model({ label: 'd' }),
    }]),
}]);

const expectedHtml = `<fieldset class="rit-filter-forest"><div class="rit-filter-tree has-terminal"><div class="control"><span class="icon is-small">
    <i class="fas fa-fw fa-caret-right"></i>
    <i class="fas fa-fw fa-caret-down"></i>
</span>
<label class="checkbox">
    <input type="checkbox" checked="">
<span>a</span></label>
</div></div><div class="rit-filter-tree has-terminal has-children"><div class="control"><span class="icon is-small">
    <i class="fas fa-fw fa-caret-right"></i>
    <i class="fas fa-fw fa-caret-down"></i>
</span>
<label class="checkbox">
    <input type="checkbox" checked="">
<span>b</span></label>
</div><fieldset class="rit-filter-forest"><div class="rit-filter-tree has-terminal"><div class="control"><span class="icon is-small">
    <i class="fas fa-fw fa-caret-right"></i>
    <i class="fas fa-fw fa-caret-down"></i>
</span>
<label class="checkbox">
    <input type="checkbox" checked="">
<span>c</span></label>
</div></div><div class="rit-filter-tree has-terminal"><div class="control"><span class="icon is-small">
    <i class="fas fa-fw fa-caret-right"></i>
    <i class="fas fa-fw fa-caret-down"></i>
</span>
<label class="checkbox">
    <input type="checkbox" checked="">
<span>d</span></label>
</div></div></fieldset></div></fieldset>`;

const spaces = /\s+/g;

function viewText(view: View): string {
    return view.$el.text().replace(spaces, '');
}

describe('annotation filter view', function() {
    beforeAll(function() {
        explorerChannel.reply('filter-hierarchy', constant(fakeHierarchy));
        explorerChannel.reply('filter-settings', () => ({
            hidden: new Collection(),
            collapsed: new Collection(),
        }));
    });

    beforeEach(function() {
        extend(this, createFilterView());
        this.view.$el.appendTo(document.body);
    });

    afterEach(function() {
        this.view.remove();
    });

    afterAll(function() {
        explorerChannel.stopReplying();
    });

    it('self-renders a full representation of the hierarchy', function() {
        expect(this.view.el.outerHTML).toBe(expectedHtml);
        expect(viewText(this.view)).toBe('abcd');
    });

    it('grows and shrinks with the hierarchy', function() {
        const insertion1 = new Model({ model: new Model({ label: 'f' }) });
        const insertion2 = new Model({ model: new Model({ label: 'g' }) });
        const insertion3 = new Model({ model: new Model({ label: 'h' }) });
        fakeHierarchy.add(insertion1, { at: 0 });
        fakeHierarchy.at(2).get('collection').add(insertion2, { at: 1 });
        fakeHierarchy.at(2).get('collection').add(insertion3);
        expect(viewText(this.view)).toBe('fabcgdh');
        fakeHierarchy.remove(insertion1);
        fakeHierarchy.at(1).get('collection').remove([insertion2, insertion3]);
        expect(viewText(this.view)).toBe('abcd');
    });

    it('triggers "update" on a collection of models to hide', function(done) {
        const spy = jasmine.createSpy();
        this.hidden.once('update', spy);
        this.view.items[0].terminal.$('input').click();
        expect(spy).toHaveBeenCalled();
        this.hidden.once('update', (collection) => {
            expect(collection.map('label')).toEqual(['a', 'd']);
            done();
        })
        this.view.items[1].collectionView.items[1].terminal.$('input').click();
    });
});
