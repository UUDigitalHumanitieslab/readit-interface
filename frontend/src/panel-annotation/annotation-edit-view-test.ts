import { constant, debounce, once } from 'lodash';
import { $, Events } from 'backbone';

import { onlyIf, startStore, endStore, event, timeout } from '../test-util';
import mockItems from '../mock-data/mock-items';
import mockOntology from '../mock-data/mock-ontology';
import { source1instance } from '../mock-data/mock-sources';

import Model from '../core/model';
import userChannel from '../common-user/user-radio';
import { oa, item, staff, dcterms } from '../common-rdf/ns';
import Subject from '../common-rdf/subject';
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

// Helper for `await`ing an event that might trigger zero or more times.
function mightTrigger(emitter: Events, eventName: string) {
    let resolver;
    const promise: Promise<unknown> & { off?(): void } = Promise.race([
        timeout(100),
        new Promise(resolve => {
            resolver = debounce(once(resolve), 10);
            emitter.on(eventName, resolver);
        }),
    ]);
    // Having a way to unregister the handler is essential for garbage
    // collection.
    promise.off = () => emitter.off(eventName, resolver);
    return promise;
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
        // Whole annotation, flattened.
        this.flat = this.flatAnnotations.get(item('100'));
        // Item body, raw Subject.
        this.item = this.items.get(item('200'));
    });

    afterEach(function() {
        this.textContainer.remove();
    });

    it('can be constructed without the context of an ExplorerView', function() {
        onlyIf(document.createRange().getClientRects, 'This test requires Range support.');
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

    it('holds on to the blank node after "create new" is clicked', async function() {
        // This is a regression test for issue #504.
        // We start with an identified annotation from our stock mock data.
        const annotation = this.items.get(item('100'));
        expect(annotation.get(oa.hasBody).length).toBe(2);

        // The regression is about an annotation that starts out unidentified,
        // so we wait until all events settle down and then remove the item.
        await event(this.flat, 'complete');
        annotation.unset(oa.hasBody, this.item);
        expect(annotation.get(oa.hasBody).length).toBe(1);
        expect(this.flat.has('item')).toBe(false);

        // Creating an edit view for this annotation, by itself, should not
        // change anything about the flat annotation model.
        const view = new AnnotationEditView({ model: this.flat });
        // We trigger the next event because it would also be triggered in a
        // real world scenario and because the edit view will otherwise not
        // create an event binding that is crucial to reproducing the
        // regression.
        view.itemOptions.trigger('update');
        expect(view.itemMultifield).not.toBeDefined();
        expect(annotation.get(oa.hasBody).length).toBe(1);
        expect(this.flat.has('item')).toBe(false);

        // When we click "create new", the edit view will create a blank node as
        // the clean slate on which the user can set the properties of the item.
        // This blank item must stay on and must not be immediately kicked off
        // again by another chain of events (i.e., #504).
        view.$('.create-item-button').click();
        expect(view.itemMultifield).toBeDefined();
        expect(annotation.get(oa.hasBody).length).toBe(2);
        expect(this.flat.has('item')).toBe(true);

        view.remove();
    });

    it('displays a delete button if the current user created the annotation', async function() {
        const flat = this.flat;
        const creator = flat.get('creator') as Subject;
        const user = new Model({
            username: String(creator.id).slice(staff().length),
        });
        userChannel.reply('user', constant(user));
        const view = new AnnotationEditView({ model: flat });
        await modelHasAttribute(flat, 'text');
        view.render();
        expect(view.$('.panel-footer button.is-danger').length).toBe(1);
        view.remove();
        userChannel.stopReplying('user');
    });

    it('does not display a delete button otherwise', async function() {
        const flat = this.flat;
        const view = new AnnotationEditView({ model: flat });
        await modelHasAttribute(flat, 'text');
        view.render();
        expect(view.$('.panel-footer button.is-danger').length).toBe(0);
        view.remove();
    });

    it('leaves the model unmodified when editing is canceled', async function(){
        // To make things as realistic as possible, mock backend responses.
        const availableItems = JSON.stringify({ '@graph': [ this.item ] });
        const respond = () => jasmine.Ajax.requests.mostRecent().respondWith({
            status: 200,
            contentType: 'application/ld+json',
            responseText: availableItems,
        });
        // Create the view and watch some events.
        const flat = this.flat;
        const view = new AnnotationEditView({ model: flat });
        view.itemOptions.on('request', respond);
        // A storm of events ensues. Wait until everything settles down.
        let maybeSelectClass = mightTrigger(view.classPicker, 'select');
        let maybeChangeItem = mightTrigger(view.itemPicker, 'change');
        await Promise.all([
            event(this.flat, 'complete'),
            maybeSelectClass,
            maybeChangeItem,
        ]);
        maybeSelectClass.off();
        maybeChangeItem.off();
        // At this point, our annotation *should* be unchanged, but there was a
        // time when this wasn't true. See #425.
        expect(flat.get('item')).toBe(this.item);
        // Trigger another storm of events.
        view.$('.btn-cancel').click();
        // Again, wait until everything settles down.
        maybeSelectClass = mightTrigger(view.classPicker, 'select');
        maybeChangeItem = mightTrigger(view.itemPicker, 'change');
        await Promise.all([ maybeSelectClass, maybeChangeItem ]);
        maybeSelectClass.off();
        maybeChangeItem.off();
        // Regardless, there should be no net change after editing is canceled.
        expect(flat.get('item')).toBe(this.item);
        // Final cleanup.
        view.itemOptions.off('request', respond);
    });
});
