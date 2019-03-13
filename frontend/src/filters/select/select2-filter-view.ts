import { extend } from 'lodash';
import View from '../../core/view';
import 'select2';

import selectFilterTemplate from './select2-filter-template';
import { SelectFilterOption } from './select-option';
import { BaseFilterView } from '../BaseFilterView';
import { BaseFilter } from './../baseFilter';
import { MultiSelectFilter } from './multiSelectFilter';


export default class Select2FilterView extends BaseFilterView {
    SELECT2ELEMENTCLASS:string = 'select';    
    filter: MultiSelectFilter;    
    applyOptionMarkUp: boolean;    

    /**
     * Ctor for SelectFilterView
     * @param applyOptionMarkUp Specify whether to use each option's className property
     * to add it in the <option> tag. Defaults to false.
     */
    constructor(filter: MultiSelectFilter, applyOptionMarkUp: boolean = false) {
        super()
        this.filter = filter;
        this.applyOptionMarkUp = applyOptionMarkUp;
    }

    render() {
        this.$el.html(this.template({ filter: this.filter }));
        this.$(`.${this.SELECT2ELEMENTCLASS}`).select2(this.getSelect2Config())
        
        // The code below fixes an issue with showing the placeholder on render.
        // On initial rendering the selected div has styling with a width of 0px. Remove it.
        this.$('.select2-container--default .select2-search--inline .select2-search__field').removeAttr('style')
        return this;
    }
    
    getSelect2Config() {
        let config = {
            placeholder: {
                id: '-1',
                text: this.filter.placeholder
            },
            width: '100%'
        }

        function applyOptionMarkup(data, container) {            
            return $.parseHTML(`<span class="${$(data.element).attr("class")}">${data.text}</span>`);
        }

        if (this.applyOptionMarkUp) {
            config.templateResult = applyOptionMarkup;
            config.templateSelection = applyOptionMarkup;
        }

        return config;
    }

    initialize() {
        this.listenTo(this.collection, 'change', this.render)
    }

    onSelectionChanged() {        
        this.filter.value = this.$(`.${this.SELECT2ELEMENTCLASS}`).val(); 
        this.changed();
    }
}

extend(Select2FilterView.prototype, {
    tagName: 'div',
    className: 'box field',
    template: selectFilterTemplate,
    events: {
        "change.select2 .select": "onSelectionChanged",
    }
});
