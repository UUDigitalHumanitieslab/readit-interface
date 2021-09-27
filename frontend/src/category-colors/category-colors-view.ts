import { extend, map, chain } from 'lodash';
import { ViewOptions as BaseOpt } from 'backbone';

import View from '../core/view';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';
import { schema } from '../common-rdf/ns';
import { getCssClassName, isColoredClass } from '../utilities/linked-data-utilities';
import { placeholderClass } from '../utilities/annotation-utilities';

import categoryColorsTemplate from './category-colors-template';

export interface ViewOptions extends BaseOpt<Node> {
    collection: Graph;
}

// Special categories that are also used for visibility filtering, in addition
// to the ontology and NLP ontology classes. See the `getFilterClasses` method
// in `../common-adapters/flat-item-model.ts` for details on how these classes
// are assigned on a per-item basis.
const specialCategories = map([
    'rit-is-nlp',
    'rit-is-semantic',
    'rit-verified',
    'rit-unverified',
    'rit-self-made',
    'rit-other-made',
], name => ({ class: name }));

// `map` iteratee to extract the properties of interest here.
function summarizeCategory(node: Node): { class: string, color?: string } {
    return {
        class: getCssClassName(node),
        color: node.get(schema.color)[0] as string,
    };
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
        this.$el.html(this.template({ categories: this.collectColors() }));
        return this;
    }

    collectColors() {
        return chain(this.collection.models)
            .filter(isColoredClass)
            .concat(placeholderClass)
            .map(summarizeCategory)
            .concat(specialCategories)
            .value();
    }
}

extend(CategoryColorsView.prototype, {
    tagName: 'style',
    template: categoryColorsTemplate,
});
