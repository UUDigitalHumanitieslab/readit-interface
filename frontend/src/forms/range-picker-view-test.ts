import { startStore, endStore } from '../test-util';
import { rdf, rdfs } from '../jsonld/ns';
import Node from '../jsonld/node';
import Graph from '../jsonld/graph';
import RangePickerView, { RangePickerOptionView } from './range-picker-view';

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

const candidateOptions = [{
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

const expectedMultipleHTML = omitWhite(`
<div class="select readit-range-picker is-multiple">
<select multiple="">
<option value="1">apple</option>
<option value="2">banana</option>
<option value="4">4</option>
<option value="5">5</option>
<option value="7">elderberry</option>
</select>
</div>
`);

const expectedNonMultipleHTML = omitWhite(`
<div class="select readit-range-picker">
<select>
<option value="1">apple</option>
<option value="2">banana</option>
<option value="4">4</option>
<option value="5">5</option>
<option value="7">elderberry</option>
</select>
</div>
`);

describe('RangePickerOptionView', function() {
    it('takes the label from the model by default', function() {
        const node = new Node({'@id': 'x'});
        const view = new RangePickerOptionView({model: node});
        expect(view.$el.text()).toBe('x');
    });
});

describe('RangePickerView', function() {
    beforeEach(startStore);
    beforeEach(function() {
        this.ontology = new Graph(ontologyWithSubclasses);
        this.property = new Node(property);
        this.candidates = new Graph(candidateOptions);
        expect(this.candidates.length).toBe(7);
    });
    afterEach(endStore);

    it('renders as a Bulma-enabled multiselect', function() {
        const picker = new RangePickerView({
            model: this.property,
            collection: this.candidates,
        });
        expect(picker.admittedTypes).toEqual(['base', 'derived']);
        expect(picker.collection.length).toBe(5);
        expect(omitWhite(picker.el.outerHTML)).toBe(expectedMultipleHTML);
    });

    it('is sensitive to the multiple option', function() {
        const picker = new RangePickerView({
            model: this.property,
            collection: this.candidates,
            multiple: false,
        });
        expect(omitWhite(picker.el.outerHTML)).toBe(expectedNonMultipleHTML);
    });
});
