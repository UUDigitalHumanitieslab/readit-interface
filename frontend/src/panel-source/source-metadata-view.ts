import { extend } from 'lodash';

import View from '../core/view';
import ldChannel from '../common-rdf/radio';
import { dcterms }  from '../common-rdf/ns';
import Node from '../common-rdf/node';
import { getLabel, getLabelFromId } from '../utilities/linked-data-utilities';
import explorerChannel from '../explorer/explorer-radio';

import metadataTemplate from './source-metadata-template';

const excludedProperties = [
    '@id',
    '@type'
];

const excludedAttributes = [
    'fullText',
    'text',
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
    userIsOwner: boolean;

    initialize(): this {
        const creators = this.model.get(dcterms.creator) as Node[];
        if (creators && creators.length) {
            const userUri = ldChannel.request('current-user-uri');
            this.userIsOwner = (creators[0].id === userUri);
        }
        this.properties = {};
        this.formatAttributes();
        this.render();
        this.listenTo(this.model, 'change', this.render);
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
        explorerChannel.trigger('metadata:edit', this);
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