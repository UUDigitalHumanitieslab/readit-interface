import { extend } from 'lodash';
import View from './../../core/view';

import categoryColoursTemplate from './category-colours-template';
import Graph from '../../jsonld/graph';
import { getCssClassName } from './../../common/utilities';



export default class CategoryColoursView extends View {
    categoryColours = []

    constructor(public graph: Graph) {
        super();
        this.collectColours();
    }

    render(): View {
        this.$el.html(this.template({ categoryColours: this.categoryColours }));
        return this;
    }

    collectColours() {
        this.graph.models.forEach(node => {
            let cssClass = getCssClassName(node);
            this.categoryColours.push({ 'class': cssClass, 'colour': node.get('schema:color') });
        });
    }
}
extend(CategoryColoursView.prototype, {
    tagName: 'style',
    template: categoryColoursTemplate,
});
