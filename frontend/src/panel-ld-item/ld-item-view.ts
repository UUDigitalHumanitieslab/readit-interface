import { extend, includes } from 'lodash';

import { CompositeView } from '../core/view';
import Node, { isNode } from '../jsonld/node';
import { owl, dcterms, rdfs } from '../jsonld/ns';
import FlatItem from '../annotation/flat-item-model';
import explorerChannel from '../explorer/radio';
import { announceRoute } from '../explorer/utilities';
import { getLabelText } from '../utilities/annotation/annotation-utilities';
import LabelView from '../utilities/label-view';
import ItemMetadataView from '../utilities/item-metadata/item-metadata-view';
import { getLabelFromId } from '../utilities/utilities';

import ldItemTemplate from './ld-item-template';

const announce = announceRoute('item', ['model', 'id']);

const excludedProperties = [
    '@id',
    '@type',
    dcterms.creator,
    dcterms.created,
    dcterms.modified,
    rdfs.seeAlso,
    owl.sameAs
];

export default class LdItemView extends CompositeView<FlatItem> {
    lblView: LabelView;
    itemMetadataView: ItemMetadataView;
    annotationMetadataView: ItemMetadataView;

    label: string;
    properties: any;

    initialize() {
        this.properties = {};

        this.on('announceRoute', announce);
        const model = this.model;
        model.whenever('annotation', this.processAnnotation, this);
        model.whenever('class', this.processClass, this);
        model.whenever('item', this.processItem, this);
        model.whenever('label', this.processLabel, this);
        model.whenever('text', this.processText, this);
        this.render().listenTo(model, 'change', this.render);
    }

    processAnnotation(model: FlatItem, annotation: Node): void {
        const itemMetaView = this.annotationMetadataView;
        if (itemMetaView) itemMetaView.remove();
        if (annotation) this.annotationMetadataView = new ItemMetadataView({
            model: annotation,
            title: 'Annotation metadata'
        }).render();
    }

    processClass(model: FlatItem, cls: Node): void {
        const label = this.lblView;
        if (label) label.remove();
        if (cls) this.lblView = new LabelView({
            model: cls,
            toolTipSetting: 'left'
        });
    }

    processItem(model: FlatItem, item: Node): void {
        const itemMetaView = this.itemMetadataView;
        const previousItem = model.previous('item');
        if (itemMetaView) itemMetaView.remove();
        if (previousItem) this.stopListening(previousItem);
        if (item) {
            this.itemMetadataView = new ItemMetadataView({
                model: item,
            }).render();
            this.listenTo(item, 'change', this.collectDetails)
                .collectDetails(item);
            this.listenTo(item, 'change', this.render);
        }
    }

    collectDetails(item: Node): void {
        for (let attribute in item.attributes) {
            if (includes(excludedProperties, attribute)) continue;
            let attributeLabel = getLabelFromId(attribute);
            let valueArray = item.get(attribute);
            valueArray.forEach(value => {
                if (!isNode(value)) {
                    this.properties[attributeLabel] = value;
                }
            });
        }
    }

    processLabel(model: FlatItem, label: string): void {
        if (!model.has('annotation')) this.label = label;
    }

    processText(model: FlatItem, text: string): void {
        this.label = getLabelText(text);
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    onRelItemsClicked(): void {
        explorerChannel.trigger('lditem:showRelated', this, this.model.get('item'));
    }

    onAnnotationsClicked(): void {
        explorerChannel.trigger('lditem:showAnnotations', this, this.model.get('item'));
    }

    onExtResourcesClicked(): void {
        explorerChannel.trigger('lditem:showExternal', this, this.model.get('item'));
    }

    onEditClicked(): void {
        if (this.model.has('annotation')) {
            explorerChannel.trigger('lditem:editAnnotation', this, this.model);
        } else {
            explorerChannel.trigger('lditem:editItem', this, this.model.get('item'));
        }
    }
}

extend(LdItemView.prototype, {
    className: 'ld-item explorer-panel',
    template: ldItemTemplate,
    subviews: [{
        view: 'lblView',
        selector: 'header aside',
    }, {
        view: 'itemMetadataView',
        selector: '.itemMetadataContainer',
    }, {
        view: 'annotationMetadataView',
        selector: '.annotationMetadataContainer',
    }],
    events: {
        'click #btnRelItems': 'onRelItemsClicked',
        'click #btnAnnotations': 'onAnnotationsClicked',
        'click #btnExtResources': 'onExtResourcesClicked',
        'click .btn-edit': 'onEditClicked'
    },
});
