import { extend } from 'lodash';

import { CompositeView } from '../core/view';
import { schema } from '../common-rdf/ns';
import Subject from '../common-rdf/subject';
import FlatItem from '../common-adapters/flat-item-model';
import { getLabel } from '../utilities/linked-data-utilities';
import IRIView from './iri-view';
import template from './selector-iri-template';

/**
 * Like LabeledIRIView, but specialized in text position selectors. Renders the
 * starting and ending position of the selection in addition to the source IRI
 * and title. The model should be a flat wrapper of an oa.SpecificResource or
 * an oa.Annotation in order for this to work as intended.
 */
export default class SelectorIRIView extends CompositeView<FlatItem> {
    hyperlink: IRIView;

    initialize() {
        this.model.whenever('source', this.updateSource, this);
        this.render().listenTo(this.model, 'change', this.render);
    }

    updateSource(model: FlatItem, source: Subject): void {
        this.hyperlink && this.hyperlink.remove();
        this.hyperlink = new IRIView({ model: source });
    }

    renderContainer(): this {
        const source = this.model.get('source');
        this.$el.html(this.template(extend({
            title: source && source.get(schema('name')),
        }, this.model.toJSON())));
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
