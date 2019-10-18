import { extend, defer } from 'lodash';

import { oa, rdf } from './../../jsonld/ns';
import Node from './../../jsonld/node';
import Graph from './../../jsonld/graph';
import { getCssClassName, getLabel, isType } from './../utilities';
import { getOntologyInstance, getLabelText, AnnotationPositionDetails, getPositionDetails } from '../annotation/annotation-utilities';

import itemSummaryBlockTemplate from './item-summary-block-template';
import BaseAnnotationView, { ViewOptions as BaseOpt } from '../../annotation/base-annotation-view';


export interface ViewOptions extends BaseOpt {
    ontology: Graph;
}

export default class ItemSummaryBlockView extends BaseAnnotationView {
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
    startSelector: Node;
    endSelector: Node;
    callbackFn: any;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        if (!options.ontology) throw new TypeError('ontology cannot be null or undefined');
        this.ontology = options.ontology;

        this.listenTo(this, 'startSelector', this.processStartSelector);
        this.listenTo(this, 'endSelector', this.processEndSelector);
        this.listenTo(this, 'body:ontologyClass', this.processOntologyClass)
        this.listenTo(this.model, 'change', this.processModel);
        this.processModel(this.model);
        return this;
    }

    processModel(model: Node): this {
        this.baseProcessBody(this.model);
        this.currentItem = model;

        if (model.has('@type')) {
            this.modelIsAnnotation = isType(this.model, oa.Annotation);
            if (this.modelIsAnnotation) {
                this.stopListening(this, 'textQuoteSelector', this.processTextQuoteSelector);
                this.listenTo(this, 'textQuoteSelector', this.processTextQuoteSelector);
                this.baseProcessModel(this.model);
                this.currentItem = getOntologyInstance(this.model, this.ontology);
            }
        }

        if (this.currentItem) {
            this.stopListening(this.currentItem, 'change', this.processItem);
            this.listenTo(this.currentItem, 'change', this.processItem);
            this.processItem(this.currentItem);
        }
        return this;
    }

    processOntologyClass(ontologyClass: Node): this {
        if (ontologyClass.has('@type')) {
            this.classLabel = getLabel(ontologyClass);
            this.$el.removeClass(this.cssClassName);
            this.cssClassName = getCssClassName(ontologyClass);
        }
        return this.render();
    }

    processItem(item: Node): this {
        this.instanceLabel = getLabel(item);
        this.render();
        return this;
    }

    processTextQuoteSelector(selector: Node): this {
        this.instanceLabel = getLabelText(selector);
        this.render();
        return this;
    }

    processStartSelector(selector: Node): this {
        if (selector.has(rdf.value)) {
            this.startSelector = selector;
            this.processSelectors();
        }
        return this;
    }

    processEndSelector(selector: Node): this {
        if (selector.has(rdf.value)) {
            this.endSelector = selector;
            this.processSelectors();
        }
        return this;
    }

    processSelectors(): this {
        if (this.startSelector && this.endSelector) {
            this.positionDetails = getPositionDetails(this.startSelector, this.endSelector);
            if (this.callbackFn) {
                this.callbackFn();
                delete this.callbackFn;
            }
        }
        return this;
    }

    ensurePositionDetails(callback: any): void {
        if (this.positionDetails) {
            defer(callback);
        }
        this.callbackFn = callback;
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
