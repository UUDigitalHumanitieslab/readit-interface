import { extend, isEmpty } from 'lodash';

import { CompositeView } from '../core/view';
import userChannel from '../common-user/user-radio';
import { dcterms, sourceOntology }  from '../common-rdf/ns';
import Node from '../common-rdf/node';
import SourceMetadataView from '../source-metadata/source-metadata-view';
import { getLabelFromId } from '../utilities/linked-data-utilities';
import i18nChannel from '../i18n/radio';

import metadataTemplate from './source-metadata-panel-template';

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

export default class MetadataPanel extends CompositeView {
    /**
     * Class to show source's metadata
     */
    userIsOwner: boolean;
    sourceMetadataView: SourceMetadataView;
    creator: string;
    identifier: string;
    dateUploaded: string;
    changes: {} = {};

    initialize(): this {
        this.model.when(dcterms.creator, this.checkOwnership, this);
        this.identifier = getLabelFromId(this.model.id as string);
        this.sourceMetadataView = new SourceMetadataView({model: this.model});
        this.render().listenTo(this.model, 'change', this.render);
        this.listenTo(this.sourceMetadataView, 'valueChanged', this.pushChange);
        return this;
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        this.$('.edit-mode').toggle();
        return this;
    }

    checkOwnership(model, creators: Node[]): void {
        const creator = creators[0];
        const creatorId = creator.id || creator['@id'];
        this.creator = getLabelFromId(creatorId);
        const userUri = userChannel.request('current-user-uri');
        // user can view the source metadata, but not edit when they're not owner
        this.userIsOwner = (creatorId === userUri);
        this.render();
        this.dateUploaded = this.model.attributes[sourceOntology('dateUploaded')][0].toLocaleDateString();
    }

    onCloseClicked() {
        this.trigger('metadata:hide', this);
    }

    toggleEditMode() {
        this.$('.btn-edit').toggle();
        this.$('.edit-mode').toggle();
        this.sourceMetadataView.readonly = !this.sourceMetadataView.readonly;
        this.sourceMetadataView.render();
        this.$('.date').find('input').prop('readonly', this.sourceMetadataView.readonly);
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

    pushChange(changedField: string, value: string) {
        this.changes[changedField] = value;
    };

    onSubmit(event: JQueryEventObject): this {
        event.preventDefault();
        if (!isEmpty(this.changes)) {
            this.model.save(this.changes, {patch: true});
        }
        this.toggleEditMode();
        return this;
    }
}

extend(MetadataPanel.prototype, {
    tagName: 'div',
    className: 'metadata-panel',
    template: metadataTemplate,
    subviews: [
        { view: 'sourceMetadataView', selector: '.panel-content'},
    ],
    events: {
        'click .btn-close': 'onCloseClicked',
        'click .btn-edit': 'toggleEditMode',
        'click .btn-cancel': 'toggleEditMode',
        'click .btn-delete': 'onDeleteClicked',
        '.submit': 'onSubmit',
    }
});
