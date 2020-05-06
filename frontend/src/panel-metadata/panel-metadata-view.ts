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
            if (excludedProperties.includes(attribute)) {
                continue;
            }
            let attributeLabel = getLabelFromId(attribute);
            if (attributeLabel==='fullText') {
                continue;
            }
            let valueArray = this.model.get(attribute);
            valueArray.forEach(value => {
                if (attributeLabel==='inLanguage') {
                    const nodeFromUri = ldChannel.request('obtain', value.id);
                    value = getLabel(nodeFromUri);
                }
                else if (attributeLabel==='sameAs') {
                    console.log(value);
                }
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