import { startStore, endStore } from '../test-util';
import { rdf, rdfs } from '../common-rdf/ns';
import Subject from '../common-rdf/subject';
import Graph from '../common-rdf/graph';
import RangePickerView from './range-picker-view';
import { options } from './base-picker-view-test';

const ontologyWithSubclasses = [{
    '@id': 'base',
}, {
    '@id': 'derived',
    [rdfs.subClassOf]: [{'@id': 'base'}],
}, {
    '@id': 'independent',
}];

const property = {
    '@id': 'property',
    '@type': [rdf.Property],
    [rdfs.range]: [{'@id': 'base'}],
};

function omitWhite(text) {
    return text.trim().replace(/\n/g, '');
}

const expectedMultipleHTML = omitWhite(`
<div class="select readit-picker is-multiple">
<select multiple="">
    <option>—</option>
<option value="1">apple</option>
<option value="2">banana</option>
<option value="4">4</option>
<option value="5">5</option>
<option value="7">elderberry</option>
</select>
</div>
`);

const expectedNonMultipleHTML = omitWhite(`
<div class="select readit-picker">
<select>
    <option>—</option>
<option value="1">apple</option>
<option value="2">banana</option>
<option value="4">4</option>
<option value="5">5</option>
<option value="7">elderberry</option>
</select>
</div>
`);

describe('RangePickerView', function() {
    beforeEach(startStore);
    beforeEach(function() {
        this.ontology = new Graph(ontologyWithSubclasses);
        this.property = new Subject(property);
        this.candidates = new Graph(options);
        expect(this.candidates.length).toBe(7);
    });
    afterEach(endStore);

    it('renders as a Bulma-enabled <select>', function() {
        const picker = new RangePickerView({
            model: this.property,
            collection: this.candidates,
        });
        expect(picker.admittedTypes).toEqual(['base', 'derived']);
        expect(picker.collection.length).toBe(5);
        expect(omitWhite(picker.el.outerHTML)).toBe(expectedNonMultipleHTML);
    });

    it('is sensitive to the multiple option', function() {
        const picker = new RangePickerView({
            model: this.property,
            collection: this.candidates,
            multiple: true,
        });
        expect(omitWhite(picker.el.outerHTML)).toBe(expectedMultipleHTML);
    });

    describe('val', function() {
        it('gets and sets the value of the underlying <select>', function() {
            const picker = new RangePickerView({
                model: this.property,
                collection: this.candidates,
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
