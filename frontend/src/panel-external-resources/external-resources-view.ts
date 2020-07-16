import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from '../core/view';
import Node from '../jsonld/node';
import ldChannel from '../jsonld/radio';

import externalResourcesTemplate from './external-resources-template';

import { rdfs, owl } from '../jsonld/ns';
import { getLabelFromId } from '../utilities/utilities';
import ItemSummaryBlockView from '../utilities/item-summary-block/item-summary-block-view';

const externalAttributes = [
    rdfs.seeAlso,
    owl.sameAs
];

export interface ViewOptions extends BaseOpt<Node> {
    model: Node;
}

export default class ExternalResourcesView extends View<Node> {
    externalResources: {label: string, urls: string[]}[];
    filteredNode: Node;
    /**
     * Keep track of the currently highlighted summary block
     */
    currentlyHighlighted: ItemSummaryBlockView;

    constructor(options?: ViewOptions) {
        super(options);
    }

    initialize(): this {
        this.displayResources();
        this.model.on('change', this.displayResources, this);
        return this;
    }

    render(): this {
        this.$el.html(this.template(this));
        return this;
    }

    displayResources(): this {
        this.externalResources = externalAttributes.map( attribute => {
            if (this.model.get(attribute) === undefined) {
                return;
            }
            return {
                label: getLabelFromId(attribute),
                urls: this.model.get(attribute) as string[]
            }
        });
        this.render();
        return this;
    }

    onEditButtonClicked(event: JQuery.TriggeredEvent): void {
        this.trigger('externalItems:edit', this);
    }
}
extend(ExternalResourcesView.prototype, {
    tagName: 'div',
    className: 'related-items explorer-panel',
    template: externalResourcesTemplate,
    events: {
        'click .btn-edit': 'onEditButtonClicked',
    },
});