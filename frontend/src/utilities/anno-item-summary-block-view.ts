import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from '../core/view';

import { oa } from '../jsonld/ns';
import Node from '../jsonld/node';
import Graph from './../jsonld/graph';
import { getCssClassName, getLabel, isType } from './utilities';

import annoItemSummaryBlockTemplate from './anno-item-summary-block-template';
import { getOntologyInstance, getOntologyClass, AnnotationPositionDetails, getPositionDetails } from './annotation-utilities';

export interface ViewOptions extends BaseOpt<Node> {
    ontology: Graph;
}

export default class AnnoItemSummaryBlockView extends View<Node> {
    instanceLabel: string;
    classLabel: string;
    cssClassName: string;
    ontology: Graph;

    /**
     * Store if the current model is an instance of oa:Annotation
     */
    modelIsAnnotation: boolean;

    /**
     * The item displayed by the current view.
     * Is either the model or the ontology instance associated with the model if its type is oa:Annotation.
     */
    currentItem: Node;

    positionDetails: AnnotationPositionDetails;

    constructor(options: ViewOptions) {
        super(options);
        if (!options.ontology) throw new TypeError('ontology cannot be null or undefined');

        this.ontology = options.ontology;
        this.currentItem = options.model;

        this.init();
    }

    init(): this {
        this.modelIsAnnotation = isType(this.model, oa.Annotation);
        if (this.modelIsAnnotation) {
            this.currentItem = getOntologyInstance(this.model, this.ontology);
            this.positionDetails = getPositionDetails(this.model);
        }

        this.instanceLabel = getLabel(this.currentItem);
        let ontologyClassItem = getOntologyClass(this.currentItem, this.ontology);
        this.classLabel = getLabel(ontologyClassItem);
        this.cssClassName = getCssClassName(ontologyClassItem);

        return this;
    }

    render(): this {
        this.$el.html(this.template(this));
        this.$el.addClass(this.cssClassName);
        return this;
    }

    highlight(): this {
        this.$el.addClass('is-highlighted');
        return this;
    }

    unHighlight(): this {
        this.$el.removeClass('is-highlighted');
        return this;
    }

    onClick(): this {
        this.trigger('click', this.currentItem);
        return this;
    }

    onHover(): this {
        this.trigger('hover', this.currentItem);
        return this;
    }
}
extend(AnnoItemSummaryBlockView.prototype, {
    tagName: 'span',
    className: 'anno-item-sum-block',
    template: annoItemSummaryBlockTemplate,
    events: {
        'click': 'onClick',
        'hover': 'onHover',
    }
});
