import { extend } from 'lodash';
import { ViewOptions as BaseOpt } from 'backbone';

import View from './../../core/view';
import Node from './../../jsonld/node';
import Graph from './../../jsonld/graph';

import categoryColoursTemplate from './category-colours-template';
import { getCssClassName } from './../../common/utilities';

export interface ViewOptions extends BaseOpt<Node> {
    collection: Graph;
}

export default class CategoryColoursView extends View {
    collection: Graph
    private categoryColours;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(): void {
        this.categoryColours = [];
        this.collectColours();

    }

    render(): View {
        this.$el.html(this.template({ categoryColours: this.categoryColours }));
        return this;
    }

    collectColours(): void {
        this.collection.each(node => {
            let cssClass = getCssClassName(node);
            this.categoryColours.push({ 'class': cssClass, 'colour': node.get('schema:color') });
        });
    }
}
extend(CategoryColoursView.prototype, {
    tagName: 'style',
    template: categoryColoursTemplate,
});
