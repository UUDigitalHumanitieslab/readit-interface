import { extend } from 'lodash';

import { CompositeView } from '../core/view';
import ldChannel from '../common-rdf/radio';
import { dcterms }  from '../common-rdf/ns';
import Node from '../common-rdf/node';
import metadataTemplate from './source-metadata-panel-template';
import SourceMetadataView from '../source-metadata/source-metadata-view';

const sourceDeletionDialog = `
Are you sure you want to delete this source?
If you delete this source, all its annotation will be deleted as well, including any annotations that other users may have made.
This cannot be undone.
`;

export default class MetadataPanel extends CompositeView {
    /**
     * Class to show source's metadata
     */
    userIsOwner: boolean;
    sourceMetadataview: SourceMetadataView;

    initialize(): this {
        this.model.when(dcterms.creator, this.checkOwnership, this);
        this.sourceMetadataview = new SourceMetadataView({model: this.model});
        this.render().listenTo(this.model, 'change', this.render);
        return this;
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    checkOwnership(model, creators: Node[]): void {
        if (creators && creators.length) {
            const creator = creators[0];
            const creatorId = creator.id || creator['@id'];
            const userUri = ldChannel.request('current-user-uri');
            if (this.userIsOwner = (creatorId === userUri)) this.render();
        }
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
    }
});
