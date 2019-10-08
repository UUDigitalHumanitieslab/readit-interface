import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';

import View from '../core/view';
import Graph from './../jsonld/graph';
import Node from '../jsonld/node';
import ldChannel from '../jsonld/radio';
import { isNode } from '../utilities/types';

import ldItemTemplate from './ld-item-template';

import { owl, oa, dcterms } from './../jsonld/ns';
import { isType, getLabel, getLabelFromId } from './../utilities/utilities';
import { getOntologyInstance } from './../utilities/annotation-utilities';

import LabelView from '../utilities/label-view';

import * as bulmaAccordion from 'bulma-accordion';
import ItemMetadataView from '../utilities/item-metadata/item-metadata-view';

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
    properties: any;
    annotations: any;
    relatedItems: Node[];
    externalResources: Node[];


    itemMetadataView: ItemMetadataView;
    annotationMetadataView: ItemMetadataView;

    constructor(options?: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        if (!options.ontology) throw new TypeError('ontology cannot be null or undefined');
        if (!options.staff) throw new TypeError('staff cannot be null or undefined');

        this.ontology = options.ontology;
        this.staff = options.staff;
        this.modelIsAnnotation = isType(this.model, oa.Annotation);
        this.currentItem = this.model;
        this.properties = new Object();
        this.annotations = new Object();
        this.relatedItems = [];

        if (this.modelIsAnnotation) {
            this.currentItem = getOntologyInstance(this.currentItem, this.ontology);
            this.annotationMetadataView = new ItemMetadataView({ model: this.model, title: 'Annotation metadata' });
            this.annotationMetadataView.render();
        }

        this.label = getLabel(this.currentItem);
        this.itemMetadataView = new ItemMetadataView({model: this.currentItem});
        this.itemMetadataView.render();

        let ontologyClass = ldChannel.request('obtain', this.currentItem.get('@type')[0] as string);
        if (ontologyClass) {
            this.lblView = new LabelView({ model: ontologyClass, toolTipSetting: 'left' });
            this.lblView.render();
        }

        this.collectDetails();
        return this;
    }

    render(): this {
        this.lblView.$el.detach();
        this.itemMetadataView.$el.detach();
        if (this.annotationMetadataView) this.annotationMetadataView.$el.detach();
        this.$el.html(this.template(this));
        this.$('header aside').append(this.lblView.el);
        this.$('.itemMetadataContainer').append(this.itemMetadataView.el);
        if (this.annotationMetadataView) this.$('.annotationMetadataContainer').append(this.annotationMetadataView.el);
        return this;
    }

    collectDetails(): this {
        for (let attribute in this.currentItem.attributes) {
            if (attribute === '@id' || attribute === '@type') {
                continue;
            }

            let attributeLabel = getLabelFromId(attribute);

            if (attribute == owl.sameAs) {
                this.externalResources = this.currentItem.get(attribute) as Node[];
                continue;
            }

            let valueArray = this.currentItem.get(attribute);
            valueArray.forEach(value => {
                if (isNode(value)) {
                    this.relatedItems.push(value as Node);
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
