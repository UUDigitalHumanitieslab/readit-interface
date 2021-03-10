import { extend } from 'lodash';

import { CollectionView } from '../core/view';
import Node from '../common-rdf/node';
import OntologyItemView from './ontology-item-view';

export default class OntologyListView extends CollectionView<Node, OntologyItemView> {
    initialize(): void {
        this.initItems().render().initCollectionEvents();
        this.listenTo(this.collection, {
            focus: this.categoryFocus
        });
    }

    makeItem(model: Node): OntologyItemView {
        const label = new OntologyItemView({ model, tagName:'div', className: 'tag category-view'}).render();
        return label;
    }

    categoryFocus(label: OntologyItemView, category: Node): void {
        this.trigger('category:clicked', label, category);
    }
}
extend(OntologyListView.prototype, {
    className: 'ontology-list',
})
   