import { extend } from 'lodash';

import explorerChannel from '../explorer/explorer-radio';
import { announceRoute } from '../explorer/utilities';
import FieldEditingPanel from '../panel-common/field-editing-panel';
import i18nChannel from '../i18n/radio';

import RelatedItemsMultifield from './related-items-edit-multifield';

const announce = announceRoute('item:related:edit', ['model', 'id']);

/**
 * Panel class that displays a RelationEditor for each related item.
 */
export default class RelatedItemsEditor extends FieldEditingPanel {
    initialize(): void {
        this.rowManager = new RelatedItemsMultifield({ model: this.model });
        super.initialize();
        this.on('announceRoute', announce);
    }

    close(): this {
        explorerChannel.trigger('relItems:edit-close', this);
        return this;
    }
}

(async function() {
    const i18next = await i18nChannel.request('i18next');
    extend(RelatedItemsEditor.prototype, {
        title: i18next.t('item.edit-related-title', 'Edit related items'),
    });
}());
