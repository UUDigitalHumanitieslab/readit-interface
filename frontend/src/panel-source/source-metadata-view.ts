import { extend } from 'lodash';

import View from '../core/view';
import userChannel from '../common-user/user-radio';
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
];

const externalAttributes = [
    'inLanguage'
];

const sourceDeletionDialog = `
Are you sure you want to delete this source?
If you delete this source, all its annotation will be deleted as well, including any annotations that other users may have made.
This cannot be undone.
`;

export default class MetadataView extends View {
    /**
     * Class to show source's metadata
     */
    properties: any;
    userIsOwner: boolean;

    initialize(): this {
        this.model.when(dcterms.creator, this.checkOwnership, this);
        this.render().listenTo(this.model, 'change', this.render);
        return this;
    }

    checkOwnership(model, creators: Node[]): void {
        if (creators && creators.length) {
            const creator = creators[0];
            const creatorId = creator.id || creator['@id'];
            const userUri = userChannel.request('current-user-uri');
            if (this.userIsOwner = (creatorId === userUri)) this.render();
        }
    }

    render(): this {
        this.$el.html(this.template(this.formatAttributes()));
        this.$('.btn-cancel, .btn-delete').hide();
        return this;
    }

    formatAttributes(): this {
        this.properties = {};
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

    toggleEditMode() {
        this.$('.panel-footer button').toggle();
    }

    async onDeleteClicked() {
        if (!confirm(sourceDeletionDialog)) return;
        const button = this.$('.btn-delete');
        button.addClass('is-loading');
        try {
            await this.model.destroy({wait: true});
        } catch (e) {
            console.debug(e);
            button.prop('disabled', true);
        } finally {
            button.removeClass('is-loading');
        }
    }
}

extend(MetadataView.prototype, {
    tagName: 'div',
    className: 'metadata-panel',
    template: metadataTemplate,
    events: {
        'click .btn-close': 'onCloseClicked',
        'click .btn-edit': 'toggleEditMode',
        'click .btn-cancel': 'toggleEditMode',
        'click .btn-delete': 'onDeleteClicked',
    }
});
