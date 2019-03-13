import { extend } from 'lodash';
import * as _ from 'underscore';
import View from '../core/view';

import categoryViewTemplate from './category-picker-template';
import CategoryCollection from './../models/category-collection';

export default class CategoryPickerView extends View {
    panelContents: any[] = undefined;
            
    render(): View { 
        if (!this.panelContents) {
            this.panelContents = this.getPanelContents();
        }

        this.$el.html(this.template({
            categories: this.collection.models,
            panelContents: this.panelContents,
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
                self.panelContents = self.getPanelContents();
            },
            error: function (collection, response, options) {
                console.error(response)
                return null;
            }
        })
    }

    /**
     * reshape data for the view
     */
    getPanelContents(): any[] {
        let panelContents = []
        
        for (let category of this.collection.models) {
            if (category.attributes.attributes) {
                panelContents.push({
                    id: category.attributes.class,
                    catId: category.attributes.id,
                    attributes: category.attributes.attributes
                });
            }
        }

        return panelContents;
    }

    /**
     * Tab control
     */
    onTabSelected(event: any) {
        var clickedTab = $(event.currentTarget);
        this.setActiveTab(clickedTab);
    }

    setActiveTab(selectedTab) {
        var tabId = selectedTab.attr('value');
        this.$('.tab').removeClass('is-active');
        selectedTab.addClass('is-active');

        this.$('.panel-content').not(`#${tabId}`).hide();
        this.$(`#${tabId}`).show();
    }

    resetTabs() {        
        let initialTab = this.$('#0');
        this.setActiveTab(initialTab);
    }

    /**
     * Event handling
     */
    onAttributeSelected(event: any) {
        var clickedAttr = $(event.currentTarget);
        var catId = clickedAttr.attr('catid');
        var attrId = clickedAttr.attr('id')

        let selectedCategory = this.collection.get(catId);
        let selectedAttribute = selectedCategory.attributes.attributes.find(a => a.id == attrId);
        
        this.triggerCategorySelected(selectedCategory, selectedAttribute);
    }

    onCategorySelected(event: any) {
        let catId = event.currentTarget.id;
        let selectedCategory = this.collection.get(catId);
        this.triggerCategorySelected(selectedCategory);
    }

    triggerCategorySelected(selectedCategory, selectedAttribute = undefined): void {        
        this.trigger('categorySelected', selectedCategory, selectedAttribute);
    }
}
extend(CategoryPickerView.prototype, {
    tagName: 'container',
    className: 'container',
    template: categoryViewTemplate,
    events: {
        'click .category': 'onCategorySelected',
        'click .tab': 'onTabSelected',
        'click .attribute': 'onAttributeSelected',
    }
});
