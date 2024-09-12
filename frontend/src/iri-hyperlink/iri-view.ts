import { extend } from 'lodash';

import { nsRoot } from 'config.json';
import View from '../core/view';

/**
 * A simple view that presents the IRI of a Subject or FlatItem as a clickable
 * hyperlink. If the IRI belongs to one of our own namespaces, it is
 * abbreviated. The link opens to a new tab.
 */
export default class IRIView extends View {
    initialize() {
        this.render();
        this.listenTo(this.model, 'change:id, change:@id', this.render);
    }

    render(): this {
        const fullId = this.model.id;
        this.$el.prop('href', fullId).text(
            fullId.startsWith(nsRoot) ? fullId.slice(nsRoot.length) : fullId
        );
        return this;
    }
}

extend(IRIView.prototype, {
    tagName: 'a',
    attributes: {
        target: '_blank',
    },
});
