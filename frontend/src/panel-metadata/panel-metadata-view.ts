import { extend } from 'lodash';
import View from './../core/view';
import metadataTemplate from './panel-metadata-template';
import ldChannel from '../jsonld/radio';
import { getLabel, getLabelFromId } from './../utilities/utilities';

const excludedProperties = [
    '@id',
    '@type'
];

const excludedAttributes = [
    'fullText',
    'sameAs'
]

const externalAttributes = [
    'inLanguage'
]

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
        for (let attribute in this.model.attributes) {
            // don't include @id, @value, fullText or sameAs info
            if (excludedProperties.includes(attribute)) {
                continue;
            }
            let attributeLabel = getLabelFromId(attribute);
            if (excludedAttributes.includes(attributeLabel)) {
                continue;
            }
            let value = this.model.get(attribute)[0];
            if (externalAttributes.includes(attributeLabel)) {
                const nodeFromUri = ldChannel.request('obtain', value.id);
                value = getLabel(nodeFromUri);
            }          
            this.properties[attributeLabel] = value;
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