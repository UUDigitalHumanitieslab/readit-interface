import { extend } from 'lodash';
import { ViewOptions as BViewOptions } from 'backbone';

import { CompositeView } from '../core/view';
import { skos } from '../common-rdf/ns';
import Label from '../label/label-view';
import editorTemplate from './item-edit-template';
import FlatItem from '../common-adapters/flat-item-model';
import LinkedItemsMultifield from './linked-items-multifield';

export const labelLanguage = 'en';

function hasLabelLanguage(label: string) {
    const language = label['@language'];
    return !language || language === labelLanguage;
}

export interface ViewOptions extends BViewOptions<FlatItem> {
    model: FlatItem;  // required
}

export default class ItemEditor extends CompositeView<FlatItem> {
    categoryLabel: Label;
    itemMultifield: LinkedItemsMultifield;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): void {
        this.categoryLabel = new Label({
            model: this.model,
            id: `category-${this.cid}`,
        });
        this.itemMultifield = new LinkedItemsMultifield({
            model: this.model.underlying
        })
        this.render();
        this.model.whenever('label', this.itemLabelFromModel, this);
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    itemLabelFromModel(): this {
        this.labelField().val(this.model.get('label'));
        return this;
    }

    itemLabelFromForm(): this {
        const item = this.model.get('item');
        const existingLabels = item.get(skos.prefLabel) as string[];
        if (existingLabels && existingLabels.length) {
            const obsoleteLabels = existingLabels.filter(hasLabelLanguage);
            obsoleteLabels.forEach(
                label => item.unset(skos.prefLabel, label, {silent: true})
            );
        }
        item.set(skos.prefLabel, {
            '@value': this.labelField().val(),
            '@language': labelLanguage,
        });
        return this;
    }

    labelField(): JQuery<HTMLElement> {
        return this.$(`#label-${this.cid}`);
    }

    submit(event: JQuery.TriggeredEvent): void {
        event.preventDefault();
        this.trigger('submit', this);
    }
}

extend(ItemEditor.prototype, {
    tagName: 'form',
    template: editorTemplate,
    events: {
        change: 'itemLabelFromForm',
        submit: 'submit',
    },
    subviews: [{
        view: 'categoryLabel',
        selector() {
            return `label[for="category-${this.cid}"]`;
        },
        method: 'after'
    },
        {
            view: 'itemMultifield',
            selector: '.item-multifield'
    }],
});
