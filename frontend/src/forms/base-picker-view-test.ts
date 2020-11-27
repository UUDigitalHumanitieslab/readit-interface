import { rdfs } from '../core/ns';
import Node from '../core/node';
import Graph from '../core/graph';
import PickerView, { PickerOptionView } from './base-picker-view';

export const options = [{
    '@id': '1',
    '@type': ['base'],
    [rdfs.label]: [{'@value': 'apple'}],
}, {
    '@id': '2',
    '@type': ['derived'],
    [rdfs.label]: [{'@value': 'banana'}],
}, {
    '@id': '3',
    '@type': ['independent'],
    [rdfs.label]: [{'@value': 'cherry'}],
}, {
    '@id': '4',
    '@type': ['base'],
}, {
    '@id': '5',
    '@type': ['derived'],
}, {
    '@id': '6',
    '@type': ['independent'],
    [rdfs.label]: [{'@value': 'date'}],
}, {
    '@id': '7',
    '@type': ['base', 'independent'],
    [rdfs.label]: [{'@value': 'elderberry'}],
}];

function omitWhite(text) {
    return text.trim().replace(/\n/g, '');
}

const expectedSingleHTML = omitWhite(`
<div class="select readit-picker">
<select>
    <option>—</option>
<option value="1">apple</option>
<option value="2">banana</option>
<option value="3">cherry</option>
<option value="4">4</option>
<option value="5">5</option>
<option value="6">date</option>
<option value="7">elderberry</option>
</select>
</div>
`);

const expectedMultipleHTML = omitWhite(`
<div class="select readit-picker is-multiple">
<select multiple="">
    <option>—</option>
<option value="1">apple</option>
<option value="2">banana</option>
<option value="3">cherry</option>
<option value="4">4</option>
<option value="5">5</option>
<option value="6">date</option>
<option value="7">elderberry</option>
</select>
</div>
`);

describe('PickerOptionView', function() {
    it('takes the label from the model by default', function() {
        const node = new Node({'@id': 'x'});
        const view = new PickerOptionView({model: node});
        expect(view.$el.text()).toBe('x');
    });
});

describe('PickerView', function() {
    beforeEach(function() {
        this.options = new Graph(options);
        expect(this.options.length).toBe(7);
    });

    it('renders as a Bulma-enabled select', function() {
        const picker = new PickerView({
            collection: this.options,
        });
        expect(omitWhite(picker.el.outerHTML)).toBe(expectedSingleHTML);
    });

    it('is sensitive to the multiple option', function() {
        const picker = new PickerView({
            collection: this.options,
            multiple: true,
        });
        expect(omitWhite(picker.el.outerHTML)).toBe(expectedMultipleHTML);
    });

    describe('val', function() {
        it('gets and sets the value of the underlying <select>', function() {
            const picker = new PickerView({
                collection: this.options,
                multiple: true,
            });
            const select = picker.$('select');
            expect(select.length).toBe(1);
            expect(select.val()).toEqual([]);
            expect(picker.val() as string[]).toEqual(select.val() as string[]);
            const value = ['1', '2'];
            picker.val(value);
            expect(select.val()).toEqual(value);
            expect(picker.val()).toEqual(value);
            select.val(['4']);
            expect(picker.val()).toEqual(['4']);
        });
    });
});
