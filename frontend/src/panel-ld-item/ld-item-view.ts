
import { extend } from 'lodash';

import Node, { isNode } from '../jsonld/node';
import ldChannel from '../jsonld/radio';
import { owl, oa, dcterms, rdfs } from './../jsonld/ns';
import { getLabelText } from '../utilities/annotation/annotation-utilities';
import LabelView from '../utilities/label-view';
import ItemMetadataView from '../utilities/item-metadata/item-metadata-view';
import { isType, getLabelFromId } from './../utilities/utilities';
import explorerChannel from '../explorer/radio';
import ldItemTemplate from './ld-item-template';
import BaseAnnotationView, { ViewOptions } from '../annotation/base-annotation-view';

const excludedProperties = [
    '@id',
    '@type',
    dcterms.creator,
    dcterms.created,
    dcterms.modified,
    rdfs.seeAlso,
    owl.sameAs
];


export default class LdItemView extends BaseAnnotationView {
    lblView: LabelView;

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


    itemMetadataView: ItemMetadataView;
    annotationMetadataView: ItemMetadataView;

    constructor(options?: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
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
        if (model.has('@type')) {
            this.modelIsAnnotation = isType(this.model, oa.Annotation);
            if (this.modelIsAnnotation) {
                super.processAnnotation(model);
                this.annotationMetadataView = new ItemMetadataView({ model: this.model, title: 'Annotation metadata' });
                this.annotationMetadataView.render();
            }
            else {
                this.listenTo(this.model, 'change', this.processOntologyInstance);
                this.processOntologyInstance(this.model);
            }
        }

        return this.render();
    }

    processOntologyClass(body: Node): this {
        this.createLabel(body);
        return this.render();
    }

    processOntologyInstance(item: Node): this {
        this.currentItem = item;

        if (!this.lblView) {
            this.createLabel(ldChannel.request('obtain', item.get('@type')[0] as string));
        }

        if (item.has('@type')) {
            this.itemMetadataView = new ItemMetadataView({ model: this.currentItem });
            this.itemMetadataView.render();
            this.collectDetails();
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
        for (let attribute in this.currentItem.attributes) {
            if (excludedProperties.includes(attribute)) {
                continue;
            }

            let attributeLabel = getLabelFromId(attribute);
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
        explorerChannel.trigger('lditem:showRelated', this, this.currentItem);
    }

    onAnnotationsClicked(): void {
        explorerChannel.trigger('lditem:showAnnotations', this, this.currentItem);
    }

    onExtResourcesClicked(): void {
        explorerChannel.trigger('lditem:showExternal', this, this.currentItem);
    }

    onEditClicked(): void {
        if (this.modelIsAnnotation) {
            explorerChannel.trigger('lditem:editAnnotation', this, this.model);
        } else {
            explorerChannel.trigger('lditem:editItem', this, this.currentItem);
        }
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
