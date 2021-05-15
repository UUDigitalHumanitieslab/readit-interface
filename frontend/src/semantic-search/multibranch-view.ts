import { extend } from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import { CollectionView } from '../core/view';

import MultibranchRow from './multibranch-row-view';

/**
 * .rowManager of Chains in a Multifield.
 */
export default class Multibranch extends CollectionView {
    initialize(): void {
        if (!this.collection) {
            this.collection = new Collection();
            this.addRow();
        }
        this.initItems().render().initCollectionEvents();
    }

    makeItem(model: Model): MultibranchRow {
        return new MultibranchRow({ model }).on('close', this.removeRow, this);
    }

    addRow(): this {
        this.collection.push(
            { precedent: this.model.get('precedent') } as unknown as Model
        );
        return this;
    }

    removeRow(row: MultibranchRow, model: Model): this {
        this.collection.remove(model);
        return this;
    }
}

extend(Multibranch.prototype, {
    className: 'field',
});
