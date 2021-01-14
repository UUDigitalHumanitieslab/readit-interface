import { extend } from 'lodash';

import { CompositeView } from '../core/view';
import Node from '../common-rdf/node';
import FlatItem from '../common-adapters/flat-item-model';
import { getLabel } from '../utilities/linked-data-utilities';
import LabeledIRIView from './labeled-iri-view';
import template from './selector-iri-template';

/**
 * Like LabeledIRIView, but specialized in text position selectors. Renders the
 * starting and ending position of the selection in addition to the source IRI
 * and label. The model should be a flat wrapper of an oa.SpecificResource or
 * an oa.Annotation in order for this to work as intended.
 */
export default class SelectorIRIView extends CompositeView<FlatItem> {
    hyperlink: LabeledIRIView;

    initialize() {
        this.model.whenever('source', this.updateSource, this);
        this.render().listenTo(this.model, 'change', this.render);
    }

    updateSource(model: FlatItem, source: Node): void {
        this.hyperlink && this.hyperlink.remove();
        this.hyperlink = new LabeledIRIView({ model: source });
    }

    renderContainer(): this {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    }
}

extend(SelectorIRIView.prototype, {
    tagName: 'span',
    template,
    subviews: [{
        view: 'hyperlink',
        method: 'prepend',
    }],
});
