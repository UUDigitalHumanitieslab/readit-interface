import { extend } from 'lodash';
import View from './../core/view';
import metadataTemplate from './panel-metadata-template';
import { owl, oa, dcterms } from './../jsonld/ns';
import Node, { isNode } from '../jsonld/node';
import { getLabelText } from '../utilities/annotation/annotation-utilities';
import { isType, getLabelFromId } from './../utilities/utilities';

const excludedProperties = [
    '@id',
    '@type'
];

export default class MetadataView extends View {
    /**
     * Class to show source's metadata
     */
    properties: any;

    initialize(): this {
        this.properties = this.model.attributes;
        return this;
    }

    render(): this {
        this.$el.html(this.template(this));
        return this;
    }

    formatAttributes(): this {
    for (let attribute in this.model.attributes) {
        if (excludedProperties.includes(attribute)) {
            continue;
        }

        let attributeLabel = getLabelFromId(attribute);

        let valueArray = this.model.attributes.get(attribute);
        valueArray.forEach(value => {
            if (isNode(value)) {
                console.log(value);
                // this.relatedItems.push(value as Node);
            }
            else {
                this.properties[attributeLabel] = value;
            }
        });
        return this;
    }
    }

}

extend(MetadataView.prototype, {
    tagName: 'div',
    className: 'metadata-panel',
    template: metadataTemplate,
    events: {
        'click .btn-edit': 'onEditClicked',
    }
});