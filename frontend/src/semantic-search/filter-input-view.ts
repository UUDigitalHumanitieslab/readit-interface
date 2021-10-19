import { extend } from 'lodash';

import { CompositeView } from '../core/view';
import { xsd, rdfs } from '../common-rdf/ns';
import ItemGraph from '../common-adapters/item-graph';
import Select2Picker from '../forms/select2-picker-view';

import semChannel from './radio';
import filterInputTemplate from './filter-input-template';
import filterInputQueryTemplate from './filter-input-query-template';

/**
 * When the user has chosen to apply a filter, the next inserted form element
 * is a FilterInput. FilterInput can take on three different appearances,
 * depending on the filter that is being applied and the expected type of the
 * selection.
 *
 *   1. If the filter merely requires that the selection "is defined" (`isIri`
 *      or `isLiteral`), FilterInput hides itself.
 *   2. If the filter requires exact equality and the expected type is IRI, a
 *      Select2Picker is shown with all available items of the appropriate type.
 *   3. In all other cases, a plain `<input type=text>` is shown.
 */
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
        // At this point, we know that we're doing either the Select2Picker or
        // the <input type=text>, and the core HTML structure has been laid out.
        // The remaining steps are to take existing content into account and
        // auto-focus whatever input element we have, so that the user can
        // continue her way through the form using the keyboard.
        let value;
        if (value = this.model.get('value')) {
            this.model.set('hasValue', true);
            if (items) {
                items.once('update', () => this.$('select').val(value));
            } else {
                this.$('input').val(value);
            }
        } else if (items) {
            const dropdown = this.subviews[0];
            items.once('update', dropdown.open, dropdown);
        } else {
            this.$('input').focus();
        }
    }

    renderContainer(): this {
        // We use this.subviews.length as a reminder of whether we are doing
        // Select2Picker or <input type=text>. If we are hiding, we never render
        // in the first place.
        if (this.subviews.length === 0) this.$el.html(this.template({}));
        return this;
    }

    remove(): this {
        this.model.set('hasValue', false);
        return super.remove();
    }

    onChange(event): void {
        // The dual 'select, input' selector ensures that we can access the
        // internal form element regardless of whether we are doing
        // Select2Picker or <input type=text>.
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
