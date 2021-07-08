import { extend } from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import View, { CollectionView } from '../core/view';
import { xsd } from '../common-rdf/ns';

import semChannel from './radio';
import Dropdown from './dropdown-view';
import FilterInput from './filter-input-view';

/**
 * Chain is a CollectionView that contains one or more Dropdowns, optionally
 * followed by a single FilterInput or Multibranch/Multifield assembly. Chains
 * provide the "meat" of the patterns and expressions in the ultimate SPARQL
 * query. The outermost element within the semantic search form is a Chain; the
 * single blank Dropdown that you see initially belongs to this Chain.
 */
export default class Chain extends CollectionView {
    initialize(): void {
        semChannel.trigger('demand:increase');
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
            // When the user selects an AND/OR operator, the chain ends with a
            // Multibranch/Multifield assembly. Multibranch itself indirectly
            // depends on Chain, so in order to avoid cyclical imports, we defer
            // the creation of this assembly to an anonymous benefactor on the
            // radio (the replyer to this request is found in
            // `semantic-search-view.ts`).
            return semChannel.request('branchout', model);
        }
        if (scheme === 'filter') {
            return new FilterInput({ model });
        }
        return new Dropdown({ model });
    }

    // Event handler for the change:selection event on this.collection.
    updateControls(model, selection): void {
        const collection = this.collection;
        // When a dropdown changes selection, all subviews to the right of it
        // need to be removed.
        while (collection.last() !== model) collection.pop();
        // No selection means a blank dropdown.
        if (!selection) return;
        const [scheme, action] = selection.id.split(':');
        const precedent = model.get('precedent');
        const range = model.get('range');
        const newModel = new Model();
        // The contents of the new model will greatly affect how it is rendered.
        // See makeItem above.
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

    remove(): this {
        semChannel.trigger('demand:decrease');
        return super.remove();
    }
}

extend(Chain.prototype, {
    tagName: 'fieldset',
    className: 'field is-grouped is-grouped-multiline',
});
