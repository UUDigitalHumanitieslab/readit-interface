import {
    extend,
    keys,
    includes,
    find,
    negate,
    isUndefined,
    isNil
} from 'lodash';

import { CompositeView } from '../core/view';
import { dcterms, owl, skos } from '../common-rdf/ns';
import Subject, { isSubject } from '../common-rdf/subject';
import FlatItem from '../common-adapters/flat-item-model';
import LabelView from '../label/label-view';
import { getLabelFromId } from '../utilities/linked-data-utilities';

import searchResultItemTemplate from './search-result-item-template';

const maxProperties = 4
const excludedAttributes = [
    '@id',
    '@type',
    dcterms.created,
    dcterms.creator,
    owl.sameAs,
    skos.prefLabel,
];

export default class SearchResultItemView extends CompositeView<FlatItem> {
    labelView: LabelView;
    properties: any;

    initialize(): this {
        this.model.when('class', this.setLabel, this);
        this.model.when('item', this.collectDetails, this);
        this.listenTo(this.model, 'change complete', this.render);
        return this;
    }

    setLabel(ontologyClass: FlatItem): void {
        this.labelView = new LabelView({ model: ontologyClass });
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    collectDetails(item: FlatItem): void {
        const attributes = keys(item.attributes);
        const properties = {};
        let propertyCount = 0;
        let keyIndex = 0;
        while (propertyCount < maxProperties && keyIndex < attributes.length) {
            const attribute = attributes[keyIndex++];
            if (includes(excludedAttributes, attribute)) continue;
            const firstValue = find(item.get(attribute), negate(isNil));
            if (isUndefined(firstValue) || isSubject(firstValue)) continue;
            const label = getLabelFromId(attribute);
            properties[label] = firstValue;
            ++propertyCount;
        }
        this.properties = properties;
    }
}

extend(SearchResultItemView.prototype, {
    className: 'search-result-item',
    template: searchResultItemTemplate,
    subviews: [{
        view: 'labelView',
        selector: '.label-container',
    }],
});
