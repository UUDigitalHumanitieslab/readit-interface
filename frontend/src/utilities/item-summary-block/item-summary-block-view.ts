import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from '../../core/view';

import { oa } from './../../jsonld/ns';
import Node from './../../jsonld/node';
import Graph from './../../jsonld/graph';
import ldChannel from './../../jsonld/radio';
import { getCssClassName, getLabel, isType } from './../utilities';
import { getOntologyInstance, AnnotationPositionDetails, getPositionDetails } from '../annotation/annotation-utilities';

import itemSummaryBlockTemplate from './item-summary-block-template';


export interface ViewOptions extends BaseOpt<Node> {
    ontology: Graph;
}

export default class ItemSummaryBlockView extends View<Node> {
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
    }

    initialize(options: ViewOptions): this {
        if (!options.ontology) throw new TypeError('ontology cannot be null or undefined');
        this.ontology = options.ontology;
        this.currentItem = options.model;

        this.modelIsAnnotation = isType(this.model, oa.Annotation);
        if (this.modelIsAnnotation) {
            this.currentItem = getOntologyInstance(this.model, this.ontology);
            this.positionDetails = getPositionDetails(this.model);
        }

        this.instanceLabel = getLabel(this.currentItem);
        let ontologyClassItem = ldChannel.request('obtain', this.currentItem.get('@type')[0] as string);

        this.classLabel = getLabel(ontologyClassItem);
        this.cssClassName = getCssClassName(ontologyClassItem);

        return this;
    }

    render(): this {
        this.$el.html(this.template(this));
        this.$el.addClass(this.cssClassName);
        return this;
    }

    select(): this {
        this.$el.addClass('is-highlighted');
        return this;
    }

    unSelect(): this {
        this.$el.removeClass('is-highlighted');
        return this;
    }

    toggleHighlight(): this {
        this.$el.toggleClass('is-highlighted');
        return this;
    }

    getTop(): number {
        return this.$el.offset().top;
    }

    getHeight(): number {
        return this.$el.outerHeight();
    }

    onClick(): this {
        this.trigger('click', this, this.model);
        return this;
    }

    onHover(): this {
        this.trigger('hover', this, this.model);
        return this;
    }

    onHoverEnd(): this {
        this.trigger('hoverEnd', this, this.model);
        return this;
    }
}
extend(ItemSummaryBlockView.prototype, {
    tagName: 'span',
    className: 'item-sum-block',
    template: itemSummaryBlockTemplate,
    events: {
        'click': 'onClick',
        'hover': 'onHover',
        'hoverEnd': 'onHoverEnd'
    }
});
