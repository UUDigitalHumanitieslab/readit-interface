import { ViewOptions as BaseOpt } from 'backbone';
import { extend, map } from 'lodash';
import Model from '../core/model';
import Collection from '../core/collection';
import CompositeView from '../core/view';

import Graph from '../jsonld/graph';
import Node from '../jsonld/node';

import externalResourcesTemplate from './external-resources-template';

import { dcterms, owl } from '../jsonld/ns';
import { getLabel, getLabelFromId } from '../utilities/utilities';
import ItemSummaryBlockView from '../utilities/item-summary-block/item-summary-block-view';

const externalAttributes = [
    'sameAs',
    'seeAlso'
];

export interface ViewOptions extends BaseOpt<Node> {
    model: Node;
}

export default class ExternalResourcesView extends CompositeView<Node> {
    externalResources: {label: string, url: string}[];
    /**
     * Keep track of the currently highlighted summary block
     */
    currentlyHighlighted: ItemSummaryBlockView;

    constructor(options?: ViewOptions) {
        super(options);
    }

    initialize(): this {
        this.externalResources = Object.keys(this.model.attributes).map(attribute => {
            const label = getLabelFromId(attribute);
            if (externalAttributes.includes(label)) {
                return {
                    'label': label, 'url': attribute
                }
            }
        }).filter( item => item!==undefined );
        this.render();
        return this;
    }



    render(): this {
        this.$el.html(this.template(this));
        if (!this.model) return;
        return this;
    }

    onEditButtonClicked(event: JQuery.TriggeredEvent): void {
        this.trigger('externalItems:edit', this, this.model);
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
