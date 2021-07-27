import { event, startStore, endStore } from '../test-util';


import { skos } from '../common-rdf/ns';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';
import { getLabel } from '../utilities/linked-data-utilities';
import ontologyData from '../mock-data/mock-ontology';
import itemData, { anno1ContentInstance } from '../mock-data/mock-items';
import ItemEditor from './item-edit-view';
import FlatItem from '../common-adapters/flat-item-model';

describe('Item edit view', function() {
    beforeEach(startStore);
    beforeEach(async function() {
        this.ontology = new Graph(ontologyData);
        this.items = new Graph(itemData);
        this.model = new FlatItem(this.items.get(anno1ContentInstance['@id']));
        this.view = new ItemEditor({model: this.model});
        await event(this.model, 'complete');
    });
    afterEach(endStore);

    describe('initialize', function() {
        it('also renders the label', async function() {
            const projectedLabel = this.view.$('span.tag.is-readit-content');
            expect(projectedLabel.length).toBe(1);
            expect(projectedLabel.text()).toBe('Content');
        });
    });

    describe('itemLabelFromModel', function() {
        it('fills the computed item label in the form field', function() {
            const formField = this.view.$(`#label-${this.view.cid}`);
            expect(formField.val()).toEqual(this.model.get('item').get(skos.prefLabel)[0]);
        });
    });

    describe('itemLabelFromForm', function() {
        it('sets the skos:prefLabel@en', function() {
            this.view.labelField().val('banana').change();
            const labels = this.model.get('item').get(skos.prefLabel);
            expect(labels.length).toBe(1);
            expect(labels[0]).toEqual('banana');
            expect(labels[0]['@language']).toEqual('en');
        });

        it('leaves no duplicates', function() {
            this.model.get('item').set(skos.prefLabel, {
                '@value': 'banana',
                '@language': 'en',
            });
            this.view.labelField().val('banana').change();
            const labels = this.model.get('item').get(skos.prefLabel);
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
