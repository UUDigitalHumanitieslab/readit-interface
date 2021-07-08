import { extend } from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import { CollectionView } from '../core/view';

import semChannel from './radio';
import MultibranchRow from './multibranch-row-view';

/**
 * Multibranch is the .rowManager of Chains in a Multifield (see `../forms/`).
 * This containing Multifield is in turn appended as the final element of a
 * Chain when the user selects an AND/OR operator in the previous Dropdown.
 */
export default class Multibranch extends CollectionView {
    initialize(): void {
        if (!this.model) this.model = new Model();
        let collection = this.collection || this.model.get('branches');
        if (!collection) {
            this.collection = collection = new Collection();
            this.addRow();
        }
        this.model.set('branches', this.collection = collection);
        this.listenTo(this.model, 'change:lengthy', this.reportSupply);
        this.listenTo(collection, 'update reset', this.checkSupply).checkSupply();
        this.initItems().render().initCollectionEvents();
    }

    makeItem(model: Model): MultibranchRow {
        return new MultibranchRow({ model }).on('close', this.removeRow, this);
    }

    addRow(): this {
        this.collection.push(
            this.model.pick(['precedent', 'range']) as unknown as Model
        );
        return this;
    }

    removeRow(row: MultibranchRow, model: Model): this {
        this.collection.remove(model);
        return this;
    }

    reportSupply(model, lengthy: boolean): void {
        semChannel.trigger(`supply:${lengthy ? 'in' : 'de'}crease`);
    }

    checkSupply(): void {
        this.model.set('lengthy', !!this.collection.length);
    }

    remove(): this {
        this.model.set('lengthy', false);
        return super.remove();
    }
}

extend(Multibranch.prototype, {
    className: 'field',
});
