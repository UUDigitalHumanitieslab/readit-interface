import { extend } from 'lodash';
import View from './../core/view';
import metadataTemplate from './panel-metadata-template';
import { owl, oa, dcterms } from './../jsonld/ns';
import Node, { isNode } from '../jsonld/node';
import { isType, getLabelFromId, getLabel } from './../utilities/utilities';

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
        this.properties = new Object();
        this.formatAttributes();
        return this;
    }

    render(): this {
        this.$el.html(this.template(this));
        return this;
    }

    formatAttributes(): this {
        console.log(this.model.attributes)
        for (let attribute in this.model.attributes) {
            if (excludedProperties.includes(attribute)) {
                continue;
            }
            let attributeLabel = getLabelFromId(attribute);
            if (attributeLabel==='fullText') {
                continue;
            }
            if (attributeLabel==='inLanguage') {
                // console.log(getSources(attribute));
            }
            let valueArray = this.model.get(attribute);
            valueArray.forEach(value => {     
                this.properties[attributeLabel] = value;

            });
        }
            return this;
    }

    onCloseClicked() {
        this.trigger('metadata:hide', this);
    }

    onEditClicked() {
        this.trigger('metadata:edit', this);
    }

}

extend(MetadataView.prototype, {
    tagName: 'div',
    className: 'metadata-panel',
    template: metadataTemplate,
    events: {
        'click .btn-edit': 'onEditClicked',
        'click .btn-close': 'onCloseClicked'
    }
});