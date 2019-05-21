import { extend } from 'lodash';
import View from './../../core/view';
import Node from './../../jsonld/node';

import categoryColoursTemplate from './category-colours-template';
import { getCssClassName } from './../../common/utilities';

export default class CategoryColoursView extends View {
    private categoryColours;

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
            let cssClass = getCssClassName(node as Node);
            this.categoryColours.push({ 'class': cssClass, 'colour': node.get('schema:color') });
        });
    }
}
extend(CategoryColoursView.prototype, {
    tagName: 'style',
    template: categoryColoursTemplate,
});
