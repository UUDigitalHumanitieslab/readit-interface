import { extend } from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import View, { CollectionView } from '../core/view';
import { xsd } from '../common-rdf/ns';

import semChannel from './radio';
import Dropdown from './dropdown-view';
import FilterInput from './filter-input-view';

export default class Chain extends CollectionView {
    initialize(): void {
        this.model = this.model || new Model();
        let collection = this.collection || this.model.get('chain');
        if (!collection) {
            collection = new Collection([
                this.model.pick(['precedent', 'range']) as unknown as Model,
            ]);
        }
        this.model.set('chain', this.collection = collection);
        this.initItems().render().initCollectionEvents();
        this.listenTo(collection, 'change:selection', this.updateControls);
    }

    makeItem(model: Model): View {
        const scheme = model.get('scheme');
        if (scheme === 'logic' && model.get('action') !== 'not') {
            return semChannel.request('branchout', model);
        }
        if (scheme === 'filter') {
            return new FilterInput({ model });
        }
        return new Dropdown({ model });
    }

    updateControls(model, selection): void {
        const collection = this.collection;
        while (collection.last() !== model) collection.pop();
        if (!selection) return;
        const [scheme, action] = selection.id.split(':');
        const precedent = model.get('precedent');
        const range = model.get('range');
        const newModel = new Model();
        switch (scheme) {
        case 'filter':
            newModel.set('filter', selection);
        case 'logic':
            newModel.set({ precedent, range, scheme, action });
            break;
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
