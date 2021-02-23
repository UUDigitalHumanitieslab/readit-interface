import { constant } from 'lodash';
import { $ } from 'backbone';

import { onlyIf, startStore, endStore, event } from '../test-util';
import mockItems from '../mock-data/mock-items';
import mockOntology from '../mock-data/mock-ontology';
import { source1instance } from '../mock-data/mock-sources';

import ldChannel from '../common-rdf/radio';
import { item, dcterms } from '../common-rdf/ns';
import Node from '../common-rdf/Node';
import Graph from '../common-rdf/graph';
import FlatItem from '../common-adapters/flat-item-model';
import FlatCollection from '../common-adapters/flat-annotation-collection';
import {
    createPlaceholderAnnotation
} from '../utilities/annotation-creation-utilities';

import AnnotationEditView from './annotation-edit-view';

const text = 'This is a text.'

// Helper for `await`ing the presence of a model attribute.
function modelHasAttribute(model, key) {
    return new Promise(resolve => model.when(key, resolve));
}

describe('AnnotationEditView', function() {
    beforeEach(startStore);
    afterEach(endStore);

    beforeEach(function() {
        this.textContainer = $(`<p>${text}</p>`);
        this.positionDetails = { startIndex: 0, endIndex: text.length };
        this.ontology = new Graph(mockOntology);
        this.sources = new Graph([source1instance]);
        this.items = new Graph(mockItems);
        this.flatAnnotations = new FlatCollection(this.items);
        this.flat = this.flatAnnotations.get(item('100'));
    });

    afterEach(function() {
        this.textContainer.remove();
    });

    it('can be constructed without the context of an ExplorerView', function() {
        onlyIf(document.createRange, 'This test requires Range support.');
        this.textContainer.appendTo('body');
        const range = document.createRange();
        range.selectNodeContents(this.textContainer.get(0).firstChild);
        const placeholder = createPlaceholderAnnotation(
            this.sources.at(0),
            range,
            this.positionDetails,
        );
        expect(() => new AnnotationEditView({
            model: new FlatItem(placeholder),
        })).not.toThrow();
    });

    it('can be constructed with a pre-existing annotation', function() {
        expect(() => new AnnotationEditView({
            model: this.flat,
        })).not.toThrow();
    });

    it('displays a delete button if the current user created the annotation', async function() {
        const flat = this.flat;
        const creator = flat.get('creator') as Node;
        ldChannel.reply('current-user-uri', constant(creator.id));
        const view = new AnnotationEditView({ model: flat });
        await modelHasAttribute(flat, 'text');
        view.render();
        expect(view.$('.panel-footer button.is-danger').length).toBe(1);
        view.remove();
        ldChannel.stopReplying('current-user-uri');
    });

    it('does not display a delete button otherwise', async function() {
        const flat = this.flat;
        const view = new AnnotationEditView({ model: flat });
        await modelHasAttribute(flat, 'text');
        view.render();
        expect(view.$('.panel-footer button.is-danger').length).toBe(0);
        view.remove();
    });
});
