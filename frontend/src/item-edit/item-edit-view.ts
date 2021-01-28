import { extend } from 'lodash';
import { ViewOptions as BViewOptions } from 'backbone';

import { CompositeView } from '../core/view';
import ldChannel from '../common-rdf/radio';
import { skos } from '../common-rdf/ns';
import Node from '../common-rdf/node';
import Label from '../label/label-view';
import { getLabel } from '../utilities/linked-data-utilities';
import editorTemplate from './item-edit-template';

export const labelLanguage = 'en';

function hasLabelLanguage(label: string) {
    const language = label['@language'];
    return !language || language === labelLanguage;
}

export interface ViewOptions extends BViewOptions<Node> {
    model: Node;  // required
}

export default class ItemEditor extends CompositeView<Node> {
    categoryLabel: Label;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): void {
        const types = this.model.get('@type');
        if (!types || !types.length) {
            throw new Error('Cannot edit an untyped item');
        }
        const category = ldChannel.request('obtain', types[0]);
        this.categoryLabel = new Label({
            model: category,
            id: `category-${this.cid}`,
        });
        this.render().itemLabelFromModel();
        this.listenTo(this.model, 'change', this.itemLabelFromModel);
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    itemLabelFromModel(): this {
        this.labelField().val(getLabel(this.model));
        return this;
    }

    itemLabelFromForm(): this {
        const existingLabels = this.model.get(skos.prefLabel) as string[];
        if (existingLabels && existingLabels.length) {
            const obsoleteLabels = existingLabels.filter(hasLabelLanguage);
            obsoleteLabels.forEach(
                label => this.model.unset(skos.prefLabel, label, {silent: true})
            );
        }
        this.model.set(skos.prefLabel, {
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
        method: 'after',
    }],
});
