import { extend } from 'lodash';

import { CompositeView } from '../core/view';
import RemoveButton from '../forms/remove-button-view';

import Chain from './chain-view';
import multibranchRowTemplate from './multibranch-row-template';

/**
 * Every row in a Multibranch has a Chain with a RemoveButton in front.
 */
export default class MultibranchRow extends CompositeView {
    removeButton: RemoveButton;
    chain: Chain;

    initialize(): void {
        this.removeButton = new RemoveButton().on('click', this.close, this);
        this.chain = new Chain({
            model: this.model,
            collection: this.collection,
        }).on('all', this.trigger, this);
        this.render();
    }

    renderContainer(): this {
        this.$el.html(this.template({}));
        return this;
    }

    close(): void {
        this.trigger('close', this, this.model);
    }
}

extend(MultibranchRow.prototype, {
    className: 'field is-horizontal',
    template: multibranchRowTemplate,
    subviews: [{
        view: 'removeButton',
        selector: '.field-label',
    }, {
        view: 'chain',
        selector: '.field-body',
    }],
});
