import { extend } from 'lodash';

import { CollectionView } from '../core/view';
import OntologyItemView from './ontology-item-view';
import FlatItem from '../common-adapters/flat-item-model';
import FlatItemCollection from '../common-adapters/flat-item-collection';

import explorerChannel from '../explorer/explorer-radio';

export default class OntologyListView extends CollectionView<FlatItem, OntologyItemView> {
    collection: FlatItemCollection;
    
    initialize(): void {
        this.initItems().render().initCollectionEvents();
        this.listenTo(this.collection, {
            focus: this.categoryFocus
        });
    }

    makeItem(model: FlatItem): OntologyItemView {
        const label = new OntologyItemView({ model, tagName:'div', className: 'tag category-view'});
        return label;
    }

    categoryFocus(category: FlatItem): void {
        explorerChannel.trigger('category:showRelevantAnnotations', this, category);
    }
}
extend(OntologyListView.prototype, {
    className: 'ontology-list',
})
   