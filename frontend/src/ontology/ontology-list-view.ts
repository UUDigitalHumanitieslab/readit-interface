import { extend } from 'lodash';

import { CollectionView } from '../core/view';
import Node from '../jsonld/node';
import LabelView from './label-view';
import ontologyListTemplate from './ontology-list-template';

export default class OntologyListView extends CollectionView<Node, LabelView> {
    initialize(): void {
        this.initItems().render().initCollectionEvents();
        this.listenTo(this.collection, {
            focus: this.categoryFocus
        });
    }

    makeItem(model: Node): LabelView {
        const label = new LabelView({ model, tagName:'div', className: 'tag category-view'}).render();
        return label;
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    categoryFocus(category: Node): void {
        this.trigger('category:clicked', category);
    }
}
extend(OntologyListView.prototype, {
    className: 'ontology-list',
    template: ontologyListTemplate,
    container: '.categories',
})
   