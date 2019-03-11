import { extend } from 'lodash';
import Collection from '../core/collection';
import * as _ from 'underscore';

import Category from './category';
import Fragment from './fragment';

import mockCategories from './mock-annotation-categories';


export default class CategoryCollection extends Collection {
    getMockData() {
        var categories: Category[] = [];
        
        for (let cat of (mockCategories)) {
            categories.push(new Category(cat));
        }

        return new CategoryCollection(categories);
    }
}

extend(CategoryCollection.prototype, {
    model: Category,
    fetch: function (options: any) {
        let categories = this.getMockData();
        this.set(categories.models)
        options.success(this, {}, {});
    }
})