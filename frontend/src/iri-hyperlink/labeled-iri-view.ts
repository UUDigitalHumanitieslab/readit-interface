import { extend } from 'lodash';

import { CompositeView } from '../core/view';
import Subject from '../common-rdf/subject';
import { getLabel } from '../utilities/linked-data-utilities';
import IRIView from './iri-view';
import template from './labeled-iri-template';

/**
 * Like IRIView, but also displays the label between parentheses after the IRI
 * if a label attribute is set. This view will compute a suitable label for any
 * bare Subject.
 */
export default class LabeledIRIView extends CompositeView<Subject> {
    hyperlink: IRIView;

    initialize() {
        this.hyperlink = new IRIView({ model: this.model });
        this.render().listenTo(this.model, 'change', this.render);
    }

    renderContainer(): this {
        this.$el.html(this.template({
            label: getLabel(this.model),
        }));
        return this;
    }
}

extend(LabeledIRIView.prototype, {
    tagName: 'span',
    template,
    subviews: [{
        view: 'hyperlink',
        method: 'prepend',
    }],
});
