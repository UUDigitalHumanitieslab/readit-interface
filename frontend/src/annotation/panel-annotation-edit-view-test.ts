import { $ } from 'backbone';

import { onlyIf } from '../test-util';

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
            ontology: new Graph(),
            model: undefined,
        })).not.toThrow();
    });
});
