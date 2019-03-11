import { extend } from 'lodash';
import * as _ from 'underscore';
import View from '../core/view';

import categoryViewTemplate from './category-picker-template';
import CategoryCollection from '../models/category-collection';

export default class CategoryPickerView extends View {
    /**
     * Category currently selected. 
     * This property helps control what part is visible on the modal
     */
    selectedCategory: any;
            
    render(): View {        
        this.$el.html(this.template({
            categories: this.collection.models,
            selectedCategory: this.selectedCategory,
        }));

        return this;
    }

    initialize(): void {
        var self = this;
        var acCollection = new CategoryCollection();

        acCollection.fetch({
            data: { 'TODO': 'TODO' },
            success: function (collection, response, options) {
                self.collection = new CategoryCollection(collection.models)
            },
            error: function (collection, response, options) {
                console.error(response)
                return null;
            }
        })
    }

    onCategorySelected(event: any) {
        let categoryId = event.currentTarget.id;
        this.selectedCategory = this.collection.get(categoryId);
        
        this.trigger('categorySelected', this.selectedCategory)

        // // remove selection
        // this.selectedCategory = undefined;
    }

    onReturnToCategories(): void {
        this.selectedCategory = undefined;
        // this.render();
    }
}
extend(CategoryPickerView.prototype, {
    tagName: 'container',
    className: 'container',
    template: categoryViewTemplate,
    events: {
        'click .category': 'onCategorySelected',
        'click #returnToCategories': 'onReturnToCategories',
    }
});
