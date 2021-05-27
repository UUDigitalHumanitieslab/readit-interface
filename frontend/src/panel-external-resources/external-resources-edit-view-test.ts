import Node from '../common-rdf/node';
import Model from '../core/model';

import ExternalResourcesEditView from './external-resources-edit-view';
import { anno1ContentInstance } from '../mock-data/mock-items';
import { item } from '../common-rdf/ns';

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
        const rowManager = this.view.rowManager;
        rowManager.updateExternalResource(this.changedModel);
        expect(rowManager.changes.models[0].get('action')).toEqual('set');
    })

    it('does not register changes of incomplete models', function() {
        const rowManager = this.view.rowManager;
        rowManager.updateExternalResource(this.changedModel);
        expect(rowManager.changes.models.length).toEqual(0);
    })

    it('does not register changes if predicate is not defined', function() {
        this.changedModel.set('predicate', undefined);
        this.changedModel.set('object', 'and another thing');
        const rowManager = this.view.rowManager;
        rowManager.updateExternalResource(this.changedModel);
        expect(rowManager.changes.models.length).toEqual(0);
    })
});
