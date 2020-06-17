import { ViewOptions as BaseOpt } from 'backbone';
import { extend, map } from 'lodash';
import Model from '../core/model';
import Collection from '../core/collection';
import CompositeView from '../core/view';

import Graph from '../jsonld/graph';
import Node from '../jsonld/node';

import externalResourcesTemplate from './external-resources-template';

import { rdfs, owl } from '../jsonld/ns';
import { getLabel, getLabelFromId } from '../utilities/utilities';
import ItemSummaryBlockView from '../utilities/item-summary-block/item-summary-block-view';
import sourceLanguageTemplate from '../panel-source-list/source-language-template';

const externalAttributes = [
    rdfs.seeAlso,
    owl.sameAs
];

export interface ViewOptions extends BaseOpt<Node> {
    model: Node;
}

export default class ExternalResourcesView extends CompositeView<Node> {
    externalResources: Collection;
    /**
     * Keep track of the currently highlighted summary block
     */
    currentlyHighlighted: ItemSummaryBlockView;

    constructor(options?: ViewOptions) {
        super(options);
    }

    initialize(): this {
        this.externalResources = new Collection(externalAttributes.map( attribute => {
            const urls = this.model.get(attribute) as Node[];
            return new Model({
                '@id': this.model.id,
                'predicate': attribute,
                'label': getLabelFromId(attribute),
                'urls': urls === undefined? new Collection() : new Collection(urls)
            })
        }));
        this.render();
        return this;
    }

    render(): this {
        this.$el.html(this.template(this));
        if (!this.model) return;
        return this;
    }

    onEditButtonClicked(event: JQuery.TriggeredEvent): void {
        this.trigger('externalItems:edit', this, this.externalResources);
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

interface ExternalResource {
    label: string,
    urls: string[]
};