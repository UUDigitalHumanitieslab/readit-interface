import { extend } from 'lodash';

import { CollectionView } from '../core/view';
import Node from '../common-rdf/node';
import OntologyItemView from './ontology-item-view';
import FlatItem from '../common-adapters/flat-item-model';

export default class OntologyListView extends CollectionView<FlatItem, OntologyItemView> {
    initialize(): void {
        this.initItems().render().initCollectionEvents();
        this.listenTo(this.collection, {
            focus: this.categoryFocus
        });
    }

    makeItem(model: FlatItem): OntologyItemView {
        const label = new OntologyItemView({ model, tagName:'div', className: 'tag category-view'}).render();
        return label;
    }

    categoryFocus(label: OntologyItemView, category: FlatItem): void {
        this.trigger('category:clicked', label, category);
    }
}
extend(OntologyListView.prototype, {
    className: 'ontology-list',
})
   