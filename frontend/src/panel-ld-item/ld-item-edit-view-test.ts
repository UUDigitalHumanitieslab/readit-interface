import { startStore, endStore } from '../test-util';

import { debounce } from 'lodash';

import { skos } from '../jsonld/ns';
import Node from '../jsonld/node';
import Graph from '../jsonld/graph';
import { getLabel } from '../utilities/utilities';
import ontologyData from '../mock-data/mock-ontology';
import itemData, { anno1ContentInstance } from '../mock-data/mock-items';
import ItemEditor from './ld-item-edit-view';

describe('Item edit view', function() {
    beforeEach(startStore);
    beforeEach(function() {
        this.ontology = new Graph(ontologyData);
        this.items = new Graph(itemData);
        this.model = this.items.get(anno1ContentInstance['@id']);
        this.view = new ItemEditor({model: this.model});
    });
    afterEach(endStore);

    describe('itemLabelFromModel', function() {
        it('fills the computed item label in the form field', function() {
            const formField = this.view.$(`#label-${this.view.cid}`);
            expect(formField.val()).toEqual(getLabel(this.model));
        });
    });

    describe('itemLabelFromForm', function() {
        it('sets the skos:prefLabel@en', function() {
            this.view.labelField().val('banana').change();
            const labels = this.model.get(skos.prefLabel);
            expect(labels.length).toBe(1);
            expect(labels[0]).toEqual('banana');
            expect(labels[0]['@language']).toEqual('en');
        });

        it('leaves no duplicates', function() {
            this.model.set(skos.prefLabel, {
                '@value': 'banana',
                '@language': 'en',
            });
            this.view.labelField().val('banana').change();
            const labels = this.model.get(skos.prefLabel);
            expect(labels.length).toBe(1);
            expect(labels[0]).toEqual('banana');
            expect(labels[0]['@language']).toEqual('en');
        });

        it('respects other languages', function() {
            this.model.set(skos.prefLabel, {
                '@value': 'cherry',
                '@language': 'fr',
            });
            this.view.labelField().val('banana').change();
            expect(this.model.has(skos.prefLabel, 'banana')).toBeTruthy();
            expect(this.model.has(skos.prefLabel, 'cherry')).toBeTruthy();
        });
    });
});
