import Node from '../jsonld/node';
import Model from '../core/model';

import ExternalResourcesEditView from './external-resources-edit-view';
import { anno1ContentInstance } from '../mock-data/mock-items';
import { item } from '../jsonld/ns';

describe('ExternalResourceEditItemView', function() {
    beforeEach(function() {
        this.model = new Node(anno1ContentInstance);
        this.view = new ExternalResourcesEditView({ model: this.model });
        this.changedModel = new Model({});
        this.changedModel.set('predicate', 'something');
    });

    it('can be constructed in isolation', function() {
        expect(this.view.$el.html()).toBeTruthy();
    });

    it('registers changes of complete models', function() {
        this.changedModel.set('object', 'and another thing');
        this.view.updateExternalResource(this.changedModel);
        expect(this.view.changes.models[0].get('action')).toEqual('set');
    })

    it('does not register changes of incomplete models', function() {
        this.view.updateExternalResource(this.changedModel);
        expect(this.view.changes.models.length).toEqual(0);
    })

    it('does not register changes if predicate is not defined', function() {
        this.changedModel.set('predicate', undefined);
        this.changedModel.set('object', 'and another thing');
        this.view.updateExternalResource(this.changedModel);
        expect(this.view.changes.models.length).toEqual(0);
    })
});
