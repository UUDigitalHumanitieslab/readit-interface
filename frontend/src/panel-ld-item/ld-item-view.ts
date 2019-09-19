import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from '../core/view';

import Graph from './../jsonld/graph';
import Node from '../jsonld/node';

import ldItemTemplate from './ld-item-template';

import { owl, oa, dcterms } from './../jsonld/ns';
import { isType, getLabel, getLabelFromId } from './../utilities/utilities';
import { getOntologyInstances } from './../utilities/annotation-utilities';

import LabelView from '../utilities/label-view';

import * as bulmaAccordion from 'bulma-accordion';

export interface ViewOptions extends BaseOpt<Node> {
    ontology: Graph;
    staff: Graph;
}

export default class LdItemView extends View<Node> {
    lblView: LabelView;
    ontology: Graph;
    staff: Graph;

    /**
     * The item displayed by the current view.
     * Is either the model or the ontology instance associated with the model if its type is oa:Annotation.
     */
    currentItem: Node;

    /**
     * Store if the current model is an instance of oa:Annotation
     */
    modelIsAnnotation: boolean;

    label: string;
    properties: any = new Object();
    itemMetadata: any = new Object();
    annotationMetadata: any = new Object();
    annotations: any = new Object();

    relatedItems: Node[] = [];
    externalResources: Node[];

    constructor(options?: ViewOptions) {
        super(options);
        if (!options.ontology) throw new TypeError('ontology cannot be null or undefined');
        if (!options.staff) throw new TypeError('staff cannot be null or undefined');

        this.ontology = options.ontology;
        this.staff = options.staff;
        this.modelIsAnnotation = isType(this.model, oa.Annotation);
        this.currentItem = this.model;

        this.init();
    }

    init(): this {
        if (this.modelIsAnnotation) {
            this.currentItem = this.getOntologyInstance();
            this.annotationMetadata[getLabelFromId(dcterms.creator)] = getLabel(this.model.get(dcterms.creator)[0] as Node);
            this.annotationMetadata[getLabelFromId(dcterms.created)] = this.model.get(dcterms.created);
        }

        this.label = getLabel(this.currentItem);

        let ontologyClass = this.getOntologyClass(this.currentItem);
        if (ontologyClass) {
            this.lblView = new LabelView({ model: ontologyClass, hasTooltipLeft: true });
            this.lblView.render();
        }

        this.collectDetails();
        return this;
    }

    render(): this {
        this.lblView.$el.detach();
        this.$el.html(this.template(this));
        this.$('header aside').append(this.lblView.el);
        this.initAccordions();
        return this;
    }

    initAccordions(): this {
        this.$('.accordion').each(function (i, accordion) {
            new bulmaAccordion(accordion);
        });
        return this;
    }

    /**
     * Get the item in oa.hasBody that is not in the ontology Graph.
     * Throws RangeError if none or multiple items are found.
     */
    getOntologyInstance(): Node {
        let ontologyInstances = getOntologyInstances(this.model, this.ontology);

        if (ontologyInstances.length !== 1) {
            throw new RangeError(
                `None or multiple ontology instances found for oa:Annotation with cid '${this.model.cid}',
                    don't know which one to display`);
        }

        return ontologyInstances[0];
    }

    /**
     * Get ontology class item from the ontology Graph
     * @param ontologyInstance The ontology instance associated with the View's current model
     */
    getOntologyClass(ontologyInstance: Node) {
        let ontologyReference = ontologyInstance.get('@type')[0] as string;
        return this.ontology.get(ontologyReference);
    }

    collectDetails(): this {
        for (let attribute in this.currentItem.attributes) {
            if (attribute === '@id' || attribute === '@type') {
                continue;
            }

            let attributeLabel = getLabelFromId(attribute);

            if (attribute == dcterms.creator) {
                this.itemMetadata[attributeLabel] = getLabel(this.currentItem.get(attribute)[0] as Node);
                continue;
            }

            if (attribute == dcterms.created) {
                this.itemMetadata[attributeLabel] = this.currentItem.get(attribute)[0];
                continue;
            }

            if (attribute == owl.sameAs) {
                this.externalResources = this.currentItem.get(attribute) as Node[];
                continue;
            }

            let valueArray = this.currentItem.get(attribute);
            valueArray.forEach(value => {
                if (value instanceof Node) {
                    this.relatedItems.push(value);
                }
                else {
                    this.properties[attributeLabel] = value;
                }
            });
        }

        return this;
    }

    onRelItemsClicked(): void {
        this.trigger('show:related', this.currentItem, this.relatedItems);
    }

    onAnnotationsClicked(): void {
        this.trigger('show:annotations', this.currentItem);
    }

    onExtResourcesClicked(): void {
        this.trigger('show:external', this.currentItem, this.externalResources);
    }

    onEditClicked(): void {
        this.trigger('edit', this.currentItem);
    }
}
extend(LdItemView.prototype, {
    tagName: 'div',
    className: 'ld-item explorer-panel',
    template: ldItemTemplate,
    events: {
        'click #btnRelItems': 'onRelItemsClicked',
        'click #btnAnnotations': 'onAnnotationsClicked',
        'click #btnExtResources': 'onExtResourcesClicked',
        'click btn-edit': 'onEditClicked'
    }
});
