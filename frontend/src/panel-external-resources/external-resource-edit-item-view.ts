import { extend, map } from 'lodash';
import View from '../core/view';

import externalResourceEditItemTemplate from './external-resource-edit-item-template';

export default class ExternalResourceEditItem extends View {

    initialize() {
        this.render();
    }

    removeUrl() {
        console.log(this.model);
    }

    addUrl() {
        console.log(this.model);
    }
}

extend(ExternalResourceEditItem.prototype, {
    template: externalResourceEditItemTemplate,
    events: {
        'click .remove': 'removeUrl',
        'click .add': 'addUrl',
    }
})