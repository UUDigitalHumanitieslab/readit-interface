
import { extend } from 'lodash';

import Graph from './../jsonld/graph';
import Node from '../jsonld/node';
import ldChannel from '../jsonld/radio';
import { isNode } from '../utilities/types';

import ldItemTemplate from './ld-item-template';

import { owl, oa, dcterms } from './../jsonld/ns';
import { isType, getLabel, getLabelFromId } from './../utilities/utilities';
import { getOntologyInstance, getLabelText } from '../utilities/annotation/annotation-utilities';

import LabelView from '../utilities/label-view';

import * as bulmaAccordion from 'bulma-accordion';
import ItemMetadataView from '../utilities/item-metadata/item-metadata-view';
import BaseAnnotationView, { ViewOptions as BaseOpt } from '../annotation/base-annotation-view';

export interface ViewOptions extends BaseOpt {
    ontology: Graph;
}

export default class LdItemView extends BaseAnnotationView {
    lblView: LabelView;
    ontology: Graph;

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
        if (!options.ontology) throw new TypeError('ontology cannot be null or undefined');
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.ontology = options.ontology;
        this.properties = new Object();
        this.annotations = new Object();
        this.relatedItems = [];

        this.listenTo(this.model, 'change', this.processModel);
        this.listenTo(this, 'textQuoteSelector', this.processTextQuoteSelector);
        this.listenTo(this, 'body:ontologyClass', this.processOntologyClass);
        this.listenTo(this, 'body:ontologyInstance', this.processOntologyInstance)
        this.processModel(this.model);
        return this;
    }

    processModel(model: Node): this {
        this.currentItem = model;

        if (model.has('@type')) {
            this.modelIsAnnotation = isType(this.model, oa.Annotation);
            if (this.modelIsAnnotation) {
                this.baseProcessModel(model);
                this.currentItem = getOntologyInstance(this.currentItem, this.ontology);
                this.annotationMetadataView = new ItemMetadataView({ model: this.model, title: 'Annotation metadata' });
                this.annotationMetadataView.render();
            }
        }

        if (this.currentItem) {
            this.stopListening(this.currentItem, 'change', this.processItem);
            this.listenTo(this.currentItem, 'change', this.processItem);
            this.processItem(this.currentItem);
        }
        return this.render();
    }

    processItem(item: Node): this {
        this.label = getLabel(this.currentItem);

        if (item.has('@type')) {
            this.itemMetadataView = new ItemMetadataView({ model: this.currentItem });
            this.itemMetadataView.render();
            this.collectDetails();
        }

        return this.render();
    }

    processOntologyClass(body: Node): this {
        this.createLabel(body);
        return this.render();
    }

    processOntologyInstance(item: Node): this {
        if (!this.lblView) {
            this.createLabel(ldChannel.request('obtain', item.get('@type')[0] as string));
        }
        return this.render();
    }

    processTextQuoteSelector(selector: Node): this {
        this.label = getLabelText(selector);
        return this.render();
    }

    createLabel(ontologyClass: Node): this {
        if (ontologyClass) {
            this.lblView = new LabelView({ model: ontologyClass, toolTipSetting: 'left' });
            this.lblView.render();
        }
        return this;
    }

    render(): this {
        if (this.lblView) this.lblView.$el.detach();
        if (this.itemMetadataView) this.itemMetadataView.$el.detach();
        if (this.annotationMetadataView) this.annotationMetadataView.$el.detach();
        this.$el.html(this.template(this));
        if (this.lblView) this.$('header aside').append(this.lblView.el);
        if (this.itemMetadataView) this.$('.itemMetadataContainer').append(this.itemMetadataView.el);
        if (this.annotationMetadataView) this.$('.annotationMetadataContainer').append(this.annotationMetadataView.el);
        return this;
    }

    collectDetails(): this {
        const excluded = ['@id', '@type', dcterms.created, dcterms.creator];

        for (let attribute in this.currentItem.attributes) {
            if (excluded.includes(attribute)) {
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
        this.trigger('lditem:showRelated', this, this.currentItem);
    }

    onAnnotationsClicked(): void {
        this.trigger('lditem:showAnnotations', this, this.currentItem);
    }

    onExtResourcesClicked(): void {
        this.trigger('lditem:showExternal', this, this.currentItem, this.externalResources);
    }

    onEditClicked(): void {
        if (this.modelIsAnnotation) this.trigger('lditem:editAnnotation', this, this.model);
        // else this.trigger('lditem:editItem', this, this.currentItem);
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
        'click .btn-edit': 'onEditClicked'
    }
});
