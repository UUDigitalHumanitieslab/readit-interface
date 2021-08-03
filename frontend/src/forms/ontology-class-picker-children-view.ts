import { extend } from 'lodash';
import FlatItem from '../common-adapters/flat-item-model';
import { CollectionView } from '../core/view';
import OntologyClassPickerItemView from './ontology-class-picker-item-view';


export default class OntologyClassPickerChildrenView extends CollectionView<
    FlatItem,
    OntologyClassPickerItemView
> {
    label: any;
    externalCloseHandler: any;


    initialize(): this {
        this.initItems().render().initCollectionEvents();
        return this;
    }

    makeItem(model: FlatItem): OntologyClassPickerItemView {
        return new OntologyClassPickerItemView({ model }).on({
            click: this.onItemClicked,
        }, this);
    }

    remove(): this {
        if (this.label) this.label.remove();
        super.remove();
        return this;
    }

    onItemClicked(model: FlatItem): this {
        this.trigger('selected', model);
        return this;
    }
}

extend(OntologyClassPickerChildrenView.prototype, {
    className: 'ontology-class-picker',
    tagName: 'div',
});
