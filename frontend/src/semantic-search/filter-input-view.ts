import { extend } from 'lodash';

import { CompositeView } from '../core/view';
import { xsd, rdfs } from '../common-rdf/ns';
import ItemGraph from '../common-adapters/item-graph';
import Select2Picker from '../forms/select2-picker-view';

import filterInputTemplate from './filter-input-template';
import filterInputQueryTemplate from './filter-input-query-template';

export default class FilterInput extends CompositeView {
    // Opting out of typechecking for this.subviews. FIXME
    subviews: any;

    initialize(): void {
        this.subviews = [];
        const { precedent, action } = this.model.attributes;
        if (action === 'isIRI' || action === 'isLiteral') {
            this.$el.hide();
            return;
        }
        let items;
        if (action === 'equals') {
            let range = precedent.get(rdfs.range);
            range = range ? range[0].id : precedent.id;
            if (!range.startsWith(xsd())) {
                items = new ItemGraph();
                items.sparqlQuery(filterInputQueryTemplate({ type: range }));
                this.subviews.push(new Select2Picker({ collection: items }));
            }
        }
        this.render();
        let value;
        if (value = this.model.get('value')) {
            this.$('select, input').val(value);
        } else if (items) {
            const dropdown = this.subviews[0];
            items.once('update', dropdown.open, dropdown);
        } else {
            this.$('input').focus();
        }
    }

    renderContainer(): this {
        if (this.subviews.length === 0) this.$el.html(this.template({}));
        return this;
    }

    onChange(event): void {
        this.model.set('value', this.$('select, input').val());
    }
}

extend(FilterInput.prototype, {
    className: 'control',
    template: filterInputTemplate,
    events: {
        change: 'onChange',
    },
});
