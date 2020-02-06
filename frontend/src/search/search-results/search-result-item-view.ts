import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from './../../core/view';

import ldChannel from './../../jsonld/radio';
import searchResultItemTemplate from './search-result-item-template';

import Node, { isNode } from '../../jsonld/node';
import LabelView from '../../utilities/label-view';
import { getLabel, getLabelFromId } from '../../utilities/utilities';
import { dcterms, owl, skos } from '../../jsonld/ns';

export interface ViewOptions extends BaseOpt<Node> {
    model: Node;
}

export default class SearchResultItemView extends View<Node> {
    labelView: LabelView;
    itemLabel: string;
    properties: any;
    propertyCount: number;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(): this {
        let ontologyClass = ldChannel.request('obtain', this.model.get('@type')[0] as string);
        this.labelView = new LabelView({ model: ontologyClass }).render();
        this.itemLabel = getLabel(this.model);
        this.propertyCount = 0;
        this.collectDetails();
        return this;
    }

    render(): this {
        this.labelView.$el.detach();
        this.$el.html(this.template(this));
        this.labelView.$el.appendTo(this.$('.label-container'));
        return this;
    }

    collectDetails(): this {
        const excluded = ['@id', '@type', dcterms.created, dcterms.creator, owl.sameAs, skos.prefLabel];

        for (let attribute in this.model.attributes) {
            if (excluded.includes(attribute)) {
                continue;
            }

            let attributeLabel = getLabelFromId(attribute);

            let valueArray = this.model.get(attribute);
            valueArray.forEach(value => {
                if (this.propertyCount < 4 && !isNode(value)) {
                    if (!this.properties) this.properties = {};
                    this.properties[attributeLabel] = value;
                    this.propertyCount++;
                }
            });
        }

        return this;
    }
}
extend(SearchResultItemView.prototype, {
    tagName: 'div',
    className: 'search-result-item',
    template: searchResultItemTemplate,
    events: {
    }
});
