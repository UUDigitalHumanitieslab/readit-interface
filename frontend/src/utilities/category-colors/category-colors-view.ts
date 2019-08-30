import { extend } from 'lodash';
import { ViewOptions as BaseOpt } from 'backbone';

import View from '../../core/view';
import Node from '../../jsonld/node';
import Graph from '../../jsonld/graph';
import { schema } from './../../jsonld/ns';

import categoryColorsTemplate from './category-colors-template';
import { getCssClassName, isRdfsClass, hasProperty } from '../utilities';

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
        this.categoryColors = [];

        this.collection.each(node => {
            if (isRdfsClass(node) && hasProperty(node, schema.color)) {
                let cssClass = getCssClassName(node);
                this.categoryColors.push({ class: cssClass, color: node.get(schema.color)[0] });
            }
        });
    }
}
extend(CategoryColorsView.prototype, {
    tagName: 'style',
    template: categoryColorsTemplate,
});
