import { extend } from 'lodash';

import View from '../core/view';
import { currentUserOwnsModel } from '../common-user/utilities';
import { dcterms }  from '../common-rdf/ns';
import Subject, { isSubject } from '../common-rdf/subject';
import { getLabel, getTurtleTerm } from '../utilities/linked-data-utilities';
import explorerChannel from '../explorer/explorer-radio';
import i18nChannel from '../i18n/radio';

import metadataTemplate from './source-metadata-template';

const excludedProperties = [
    '<@id>',
    '<@type>',
    'vocab:fullText',
    'schema:text',
    'owl:sameAs'
];

let sourceDeletionDialog: string;
const dialogDefault = `
Are you sure you want to delete this source?
If you delete this source, all its annotation will be deleted as well, including any annotations that other users may have made.
This cannot be undone.
`;
(async function() {
    const i18next = await i18nChannel.request('i18next');
    sourceDeletionDialog = i18next.t('source.delete-confirm', dialogDefault);
}());

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

    checkOwnership(model): void {
        if (this.userIsOwner = currentUserOwnsModel(model)) this.render();
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
            let attributeLabel = getTurtleTerm(attribute);
            if (excludedProperties.includes(attributeLabel)) {
                continue;
            }
            let value: string | Subject = this.model.get(attribute)[0];
            if (isSubject(value)) value = getLabel(value);
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
