import { extend } from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import View, { CollectionView } from '../core/view';
import { xsd } from '../common-rdf/ns';

import semChannel from './radio';
import Dropdown from './dropdown-view';

export default class Chain extends CollectionView {
    initialize(): void {
        let collection = this.collection;
        if (!collection) {
            this.collection = collection = new Collection([
                { precedent: this.model } as unknown as Model,
            ]);
        }
        this.initItems().render().initCollectionEvents();
        this.listenTo(collection, 'change:selection', this.updateControls);
    }

    makeItem(model: Model): View {
        const action = model.get('action');
        switch (action) {
        case 'and':
        case 'or':
            return semChannel.request('branchout', model);
        }
        return new Dropdown({ model });
    }

    updateControls(model, selection): void {
        const collection = this.collection;
        while (collection.last() !== model) collection.pop();
        const precedent = model.get('precedent');
        const [scheme, action] = selection ? selection.id.split(':') : [];
        const newModel = new Model();
        switch (scheme) {
        case 'logic':
            newModel.set({ precedent });
            if (action !== 'not') newModel.set({ scheme, action });
            break;
        case 'filter':
            // TODO
        default:
            newModel.set('precedent', selection);
        }
        collection.push(newModel);
    }
}

extend(Chain.prototype, {
    tagName: 'fieldset',
    className: 'field is-grouped is-grouped-multiline',
});
