import { extend } from 'lodash';
import * as i18next from 'i18next';

import explorerChannel from '../explorer/explorer-radio';
import { announceRoute } from '../explorer/utilities';
import FieldEditingPanel from '../panel-common/field-editing-panel';

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

extend(ExternalResourcesEditView.prototype, {
    title: i18next.t('edit_external_resources', 'Edit external resources'),
});
