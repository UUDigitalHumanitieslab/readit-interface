import { extend, compact, map } from 'lodash';
import { ViewOptions as BaseOpt } from 'backbone';

import View from '../core/view';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';
import { schema } from '../common-rdf/ns';
import { getCssClassName, isRdfsClass } from '../utilities/linked-data-utilities';
import { placeholderClass } from '../utilities/annotation-utilities';

import categoryColorsTemplate from './category-colors-template';

export interface ViewOptions extends BaseOpt<Node> {
    collection: Graph;
}

export default class CategoryColorsView extends View {
    collection: Graph;

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
        const classes = this.collection.models.concat(placeholderClass);
        return compact(map(classes, node => {
            if (isRdfsClass(node) && node.has(schema.color)) {
                return {
                    class: getCssClassName(node),
                    color: node.get(schema.color)[0],
                };
            }
        }));
    }
}

extend(CategoryColorsView.prototype, {
    tagName: 'style',
    template: categoryColorsTemplate,
});
