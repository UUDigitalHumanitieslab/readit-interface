import { ViewOptions as BaseOpt } from 'backbone';
import { extend, sortBy } from 'lodash';
import View from '../core/view';

import { oa } from '../jsonld/ns';
import Node from '../jsonld/node';
import Graph from '../jsonld/graph';

import { isType, getScrollTop } from '../utilities/utilities';

import annotationEditTemplate from './panel-annotation-edit-template';
import AnnoItemSummaryBlockView from '../utilities/anno-item-summary-block-view';
import { getSource } from '../utilities/annotation-utilities';
import OntologyClassPickerView from '../utilities/ontology-class-picker/ontology-class-picker-view';


export interface ViewOptions extends BaseOpt<Node> {
    ontology: Graph;
}

export default class AnnotationEditView extends View<Node> {
    ontology: Graph;

    constructor(options: ViewOptions) {
        super(options);
    }


    initialize(options): this {
        this.ontology = options.ontology;
        return this;
    }

    render(): this {
        this.$el.html(this.template(this));
        this.$(".anno-edit-form").validate({
            errorClass: "help is-danger",
            ignore: "",
        });

        let ddOntology = new OntologyClassPickerView({
            collection: this.ontology
        })
        ddOntology.render().$el.appendTo(this.$('.ddOntology'));

        return this;
    }

    onSaveClicked(): this {
        return this;
    }
}
extend(AnnotationEditView.prototype, {
    tagName: 'div',
    className: 'annotation-edit-panel explorer-panel',
    template: annotationEditTemplate,
    events: {
        'click .btn-save': 'onSaveClicked',
    }
});
