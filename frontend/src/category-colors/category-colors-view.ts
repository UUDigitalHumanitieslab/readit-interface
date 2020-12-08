import { extend, compact } from 'lodash';
import { ViewOptions as BaseOpt } from 'backbone';

import View from '../core/view';
import Node from '../core/node';
import Graph from '../core/graph';
import { schema } from '../core/ns';

import categoryColorsTemplate from './category-colors-template';
import { getCssClassName, isRdfsClass } from '../utilities/linked-data-utilities';

export interface ViewOptions extends BaseOpt<Node> {
    collection: Graph;
}

export default class CategoryColorsView extends View {
    collection: Graph

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(): void {
        this.render().listenTo(this.collection, 'update reset', this.render);
    }

    render(): View {
        this.$el.html(this.template({ categoryColors: this.collectColors() }));
        return this;
    }

    collectColors() {
        return compact(this.collection.map(node => {
            if (isRdfsClass(node) && node.has(schema.color)) {
                return {
                    class: getCssClassName(node),
                    color: node.get(schema.color)[0] ,
                };
            }
        }));
    }
}

extend(CategoryColorsView.prototype, {
    tagName: 'style',
    template: categoryColorsTemplate,
});
