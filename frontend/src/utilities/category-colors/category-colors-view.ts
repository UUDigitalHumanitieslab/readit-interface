import { extend } from 'lodash';
import { ViewOptions as BaseOpt } from 'backbone';

import View from '../../core/view';
import Node from '../../jsonld/node';
import Graph from '../../jsonld/graph';
import { schema } from './../../jsonld/ns';

import categoryColorsTemplate from './category-colors-template';
import { getCssClassName, isRdfsClass, hasTerm } from '../utilities';

export interface ViewOptions extends BaseOpt<Node> {
    collection: Graph;
}

export default class CategoryColorsView extends View {
    collection: Graph
    categoryColors: any;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(): void {
        this.collectColours();
    }

    render(): View {
        this.$el.html(this.template({ categoryColors: this.categoryColors }));
        return this;
    }

    collectColours(): void {
        this.categoryColors = this.collection.map(node => {
            if (isRdfsClass(node) && hasTerm(node, schema.color)) {
                let cssClass = getCssClassName(node);
                return { class: cssClass, color: node.get(schema.color)[0]['@value'] };
            }
        });
    }


}
extend(CategoryColorsView.prototype, {
    tagName: 'style',
    template: categoryColorsTemplate,
});
