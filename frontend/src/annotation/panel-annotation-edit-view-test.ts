import { constant } from 'lodash';
import { $ } from 'backbone';

import { onlyIf } from '../test-util';
import mockItems from '../mock-data/mock-items';

import ldChannel from '../jsonld/radio';
import { item, dcterms } from '../jsonld/ns';
import Node from '../jsonld/Node';
import Graph from '../jsonld/graph';
import AnnotationEditView from './panel-annotation-edit-view';

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
            model: new Node(mockItems[0]),
        })).not.toThrow();
    });

    it('displays a delete button if the current user created the annotation', function() {
        const items = new Graph(mockItems);
        const annotation = items.get(item('100'));
        const creator = annotation.get(dcterms.creator)[0] as Node;
        ldChannel.reply('current-user-uri', constant(creator.id));
        const view = new AnnotationEditView({ model: annotation }).render();
        expect(view.$('.panel-footer button.is-danger').length).toBe(1);
        view.remove();
        ldChannel.stopReplying('current-user-uri');
    });

    it('does not display a delete button otherwise', function() {
        const items = new Graph(mockItems);
        const annotation = items.get(item('100'));
        const creator = annotation.get(dcterms.creator)[0] as Node;
        const view = new AnnotationEditView({ model: annotation }).render();
        expect(view.$('.panel-footer button.is-danger').length).toBe(0);
        view.remove();
    });
});
