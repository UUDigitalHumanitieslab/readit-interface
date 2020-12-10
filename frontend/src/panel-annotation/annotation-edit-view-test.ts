import { constant } from 'lodash';
import { $ } from 'backbone';

import { onlyIf, startStore, endStore, event } from '../test-util';
import mockItems from '../mock-data/mock-items';

import ldChannel from '../common-rdf/radio';
import { item, dcterms } from '../common-rdf/ns';
import Node from '../common-rdf/Node';
import Graph from '../common-rdf/graph';

import FlatItem from '../common-adapters/flat-item-model';
import AnnotationEditView from './annotation-edit-view';

const text = 'This is a text.'

describe('AnnotationEditView', function() {
    beforeEach(function() {
        this.textContainer = $(`<p>${text}</p>`);
        this.positionDetails = {
            startNodeIndex: 0,
            startCharacterIndex: 0,
            endNodeIndex: 0,
            endCharacterIndex: text.length,
        };
    });

    beforeEach(startStore);
    afterEach(endStore);

    afterEach(function() {
        this.textContainer.remove();
    });

    it('can be constructed without the context of an ExplorerView', function() {
        onlyIf(document.createRange, 'This test requires Range support.');
        this.textContainer.appendTo('body');
        const range = document.createRange();
        range.selectNodeContents(this.textContainer.get(0).firstChild);
        expect(() => new AnnotationEditView({
            range,
            positionDetails: this.positionDetails,
            source: new Node({'@id': 'x'}),
            model: undefined,
        })).not.toThrow();
    });

    it('can be constructed with a pre-existing annotation', function() {
        expect(() => new AnnotationEditView({
            model: new FlatItem(new Node(mockItems[0])),
        })).not.toThrow();
    });

    it('displays a delete button if the current user created the annotation', async function() {
        const items = new Graph(mockItems);
        const annotation = items.get(item('100'));
        const creator = annotation.get(dcterms.creator)[0] as Node;
        ldChannel.reply('current-user-uri', constant(creator.id));
        const flat = new FlatItem(annotation);
        const view = new AnnotationEditView({ model: flat });
        await event(flat, 'change:text');
        view.render();
        expect(view.$('.panel-footer button.is-danger').length).toBe(1);
        view.remove();
        ldChannel.stopReplying('current-user-uri');
    });

    it('does not display a delete button otherwise', async function() {
        const items = new Graph(mockItems);
        const annotation = items.get(item('100'));
        const flat = new FlatItem(annotation);
        const view = new AnnotationEditView({ model: flat });
        await event(flat, 'change:text');
        view.render();
        expect(view.$('.panel-footer button.is-danger').length).toBe(0);
        view.remove();
    });
});
