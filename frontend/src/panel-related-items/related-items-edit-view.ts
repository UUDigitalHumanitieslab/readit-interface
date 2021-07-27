import { extend } from 'lodash';

import explorerChannel from '../explorer/explorer-radio';
import { announceRoute } from '../explorer/utilities';
import FieldEditingPanel from '../panel-common/field-editing-panel';

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

extend(RelatedItemsEditor.prototype, {
    title: 'Edit related items',
});
