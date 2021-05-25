import { extend } from 'lodash';

import { CollectionView } from '../core/view';
import OntologyItemView from './ontology-item-view';
import FlatItem from '../common-adapters/flat-item-model';
import FlatItemCollection from '../common-adapters/flat-item-collection';

export default class OntologyListView extends CollectionView<FlatItem, OntologyItemView> {
    collection: FlatItemCollection;
    
    initialize(): void {
        this.initItems().render().initCollectionEvents();
    }

    makeItem(model: FlatItem): OntologyItemView {
        const label = new OntologyItemView({ model, tagName:'div', className: 'tag category-view'});
        return label;
    }
}
extend(OntologyListView.prototype, {
    className: 'ontology-list',
})
   