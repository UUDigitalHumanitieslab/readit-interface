import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import * as i18next from 'i18next';

import View from '../core/view';
import Node from '../common-rdf/node';

import itemMetadataTemplate from './item-metadata-template';

import { dcterms } from '../common-rdf/ns';
import { getLabel } from '../utilities/linked-data-utilities';

import * as bulmaAccordion from 'bulma-accordion';

export interface ViewOptions extends BaseOpt<Node> {
    model: Node;
    /**
     * Optional. Title of the accordion containing the metadata.
     * Defaults to 'Item metadata'.
     */
    title?: string;
}

export default class ItemMetadataView extends View<Node> {
    title: string;

    constructor(options?: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): void {
        this.title = options.title || i18next.t('item.metadata-title', 'Item metadata');
        this.render().listenTo(this.model, 'change', this.render);
    }

    render(): this {
        this.$el.html(this.template(this.collectDetails()));
        return this.initAccordions();
    }

    collectDetails() {
        const metadata: any = {};
        if (this.model.has(dcterms.creator)) {
            metadata['creator'] = getLabel(this.model.get(dcterms.creator)[0] as Node);
        }
        if (this.model.has(dcterms.created)) {
            metadata['created'] = this.model.get(dcterms.created)[0];
        }
        if (this.model.has(dcterms.modified)) {
            metadata['modified'] = this.model.get(dcterms.modified)[0];
        }
        return { metadata, title: this.title };
    }

    initAccordions(): this {
        this.$('.accordion').each(function (i, accordion) {
            new bulmaAccordion(accordion);
        });
        return this;
    }
}

extend(ItemMetadataView.prototype, {
    tagName: 'div',
    className: 'item-metadata accordions',
    template: itemMetadataTemplate,
});
