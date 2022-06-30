import { extend } from 'lodash';

import explorerChannel from '../explorer/explorer-radio';
import { announceRoute } from '../explorer/utilities';
import FieldEditingPanel from '../panel-common/field-editing-panel';
import i18nChannel from '../i18n/radio';

import ExternalResourceMultifield from './external-resources-multifield';

const announce = announceRoute('item:external:edit', ['model', 'id']);

/**
 * Panel class that displays a RelationEditor for each related item.
 */
export default class ExternalResourcesEditView extends FieldEditingPanel {
    initialize(): void {
        this.rowManager = new ExternalResourceMultifield({ model: this.model });
        super.initialize();
        this.on('announceRoute', announce);
    }

    close(): this {
        explorerChannel.trigger('externalItems:edit-close', this);
        return this;
    }
}

(async function() {
    const i18next = await i18nChannel.request('i18next');
    extend(ExternalResourcesEditView.prototype, {
        title: i18next.t('item.edit-external-title', 'Edit external resources'),
    });
}());
