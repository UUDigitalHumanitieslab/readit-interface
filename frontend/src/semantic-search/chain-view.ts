import { extend } from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import View, { CollectionView } from '../core/view';

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
        const precedent = model.get('precedent');
        const scheme = precedent && precedent.id.split(':')[0];
        switch (scheme) {
        case 'logic':
            // TODO
        case 'filter':
            // TODO
        }
        return new Dropdown({ model });
    }

    updateControls(model, selection): void {
        const collection = this.collection;
        while (collection.last() !== model) collection.pop();
        collection.push({ precedent: selection } as unknown as Model);
    }
}

extend(Chain.prototype, {
    tagName: 'fieldset',
    className: 'field is-grouped is-grouped-multiline',
});
