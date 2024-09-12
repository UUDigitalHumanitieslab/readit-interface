import { extend } from 'lodash';

import View from '../core/view';
import Subject from '../common-rdf/subject';
import { getTurtleTerm } from '../utilities/linked-data-utilities';

/**
 * Simple view to display an IRI in ns:term notation as a clickable hyperlink.
 */
export default class ScopedIriHyperlink extends View<Subject> {
    initialize(): void {
        this.render().listenTo(this.model, 'change:@id', this.render);
    }

    render(): this {
        this.$el.prop('href', this.model.id).text(getTurtleTerm(this.model));
        return this;
    }
}

extend(ScopedIriHyperlink.prototype, {
    tagName: 'a',
    className: 'rit-scoped-iri',
    attributes: {
        target: '_blank',
    },
});
