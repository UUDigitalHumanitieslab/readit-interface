import RemoveButton from '../forms/remove-button-view';

import Chain from './chain-view';

/**
 * Every row in a Multibranch is a Chain with a RemoveButton in front.
 */
export default class MultibranchRow extends Chain {
    removeButton: RemoveButton;

    initialize(): void {
        this.removeButton = new RemoveButton().on('click', this.close, this);
        super.initialize();
    }

    beforeRender(): this {
        this.removeButton.$el.detach();
        return this;
    }

    afterRender(): this {
        this.removeButton.$el.prependTo(this.$el);
        return this;
    }

    remove(): this {
        this.removeButton.remove();
        return super.remove();
    }

    close(): void {
        this.trigger('close', this, this.model);
    }
}
