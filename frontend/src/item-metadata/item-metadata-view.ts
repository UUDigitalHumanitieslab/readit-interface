import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from '../core/view';

import Node from '../common-rdf/node';

import itemMetadataTemplate from './item-metadata-template';

import { dcterms } from '../common-rdf/ns';
import { getLabel } from '../utilities/linked-data-utilities';

import * as bulmaAccordion from 'bulma-accordion';
import FlatItem from '../common-adapters/flat-item-model';

export interface ViewOptions extends BaseOpt<FlatItem> {
    model: FlatItem;
    /**
     * Optional. Title of the accordion containing the metadata.
     * Defaults to 'Item metadata'.
     */
    title?: string;
}

export default class ItemMetadataView extends View<FlatItem> {
    title: string;
    metadata: any;

    constructor(options?: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.title = 'Item metadata';
        if (options.title) this.title = options.title;
        this.metadata = new Object();
        this.collectDetails();
        return this;
    }

    render(): this {
        this.$el.html(this.template(this));
        this.initAccordions();
        return this;
    }

    collectDetails(): this {
        if (this.model.has(dcterms.creator)) {
            this.metadata['creator'] = getLabel(this.model.get(dcterms.creator)[0] as Node);
        }
        if (this.model.has(dcterms.created)) {
            this.metadata['created'] = this.model.get(dcterms.created)[0];
        }
        if (this.model.has(dcterms.modified)) {
            this.metadata['modified'] = this.model.get(dcterms.modified)[0];
        }
        return this;
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
    events: {
    }
});
