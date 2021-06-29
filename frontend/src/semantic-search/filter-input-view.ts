import { extend } from 'lodash';

import { CompositeView } from '../core/view';
import { xsd, rdfs } from '../common-rdf/ns';
import ItemGraph from '../common-adapters/item-graph';
import Select2Picker from '../forms/select2-picker-view';

import semChannel from './radio';
import filterInputTemplate from './filter-input-template';
import filterInputQueryTemplate from './filter-input-query-template';

export default class FilterInput extends CompositeView {
    // Opting out of typechecking for this.subviews. FIXME
    subviews: any;

    initialize(): void {
        this.subviews = [];
        const { precedent, range, action } = this.model.attributes;
        this.model.set('hasValue', false);
        this.listenTo(this.model, 'change:hasValue', this.reportSupply);
        if (action === 'isIRI' || action === 'isLiteral') {
            this.model.set('hasValue', true);
            this.$el.hide();
            return;
        }
        let items;
        if (action === 'equals') {
            const rangeId = range.first().id;
            if (!rangeId.startsWith(xsd())) {
                items = new ItemGraph();
                items.sparqlQuery(filterInputQueryTemplate({ type: rangeId }));
                this.subviews.push(new Select2Picker({ collection: items }));
            }
        }
        this.render();
        let value;
        if (value = this.model.get('value')) {
            this.model.set('hasValue', true);
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

    remove(): this {
        this.model.set('hasValue', false);
        return super.remove();
    }

    onChange(event): void {
        const value = this.$('select, input').val();
        this.model.set({ value, hasValue: !!value });
    }

    reportSupply(model, hasValue: boolean): void {
        semChannel.trigger(`supply:${hasValue ? 'in' : 'de'}crease`);
    }
}

extend(FilterInput.prototype, {
    className: 'control',
    template: filterInputTemplate,
    events: {
        change: 'onChange',
    },
});
