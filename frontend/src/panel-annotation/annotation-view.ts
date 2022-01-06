import { extend, includes } from 'lodash';

import { CompositeView } from '../core/view';
import Node, { isNode } from '../common-rdf/node';
import FlatItem from '../common-adapters/flat-item-model';
import FlatCollection from '../common-adapters/flat-annotation-collection';
import explorerChannel from '../explorer/explorer-radio';
import { report404 } from '../explorer/utilities';
import { getLabelText } from '../utilities/annotation-utilities';
import LabelView from '../label/label-view';
import excludedProperties from '../item-metadata/excluded-properties';
import ItemMetadataView from '../item-metadata/item-metadata-view';
import { getLabelFromId } from '../utilities/linked-data-utilities';

import { announceRoute } from './utilities';
import annotationTemplate from './annotation-template';

const announce = announceRoute(false);

export default class AnnotationView extends CompositeView<FlatItem> {
    collection: FlatCollection;
    lblView: LabelView;
    itemMetadataView: ItemMetadataView;
    annotationMetadataView: ItemMetadataView;

    label: string;
    properties: any;
    annotationSerial: string;
    itemSerial: string;
    needsVerification: boolean;

    initialize() {
        this.properties = {};

        this.on('announceRoute', announce);
        const model = this.model;
        model.whenever('annotation', this.processAnnotation, this);
        model.whenever('class', this.processClass, this);
        model.whenever('item', this.processItem, this);
        model.whenever('label', this.processLabel, this);
        model.whenever('text', this.processText, this);
        model.whenever('needsVerification', this.processVerificationStatus, this);
        this.listenToOnce(model.underlying, 'error', report404);
        this.render().listenTo(model, 'change', this.render);
    }

    processAnnotation(model: FlatItem, annotation: Node): void {
        this.dispose('annotationMetadataView');
        if (annotation) {
            this.annotationMetadataView = new ItemMetadataView({
                model: annotation,
                title: 'Annotation metadata'
            }).render();
        }
    }

    processClass(model: FlatItem, cls: Node): void {
        this.dispose('lblView');
        if (cls) this.lblView = new LabelView({model, toolTipSetting: 'left'});
    }

    processItem(model: FlatItem, item: Node): void {
        this.dispose('itemMetadataView');
        const previousItem = model.previous('item');
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
        this.properties = {};
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

    processVerificationStatus(model: FlatItem, needs: boolean): void {
        this.needsVerification = needs;
        if (needs) this.render();
    }

    renderContainer(): this {
        const annotation = this.model.get('annotation');
        const item = this.model.get('item');
        this.annotationSerial = annotation && getLabelFromId(annotation.id);
        this.itemSerial = item && getLabelFromId(item.id);
        this.$el.html(this.template(this));
        return this;
    }

    onRelItemsClicked(): void {
        explorerChannel.trigger('annotation:showRelated', this, this.model.get('item'));
    }

    onAnnotationsClicked(): void {
        explorerChannel.trigger('annotation:showAnnotations', this, this.model.get('item'));
    }

    onExtResourcesClicked(): void {
        explorerChannel.trigger('annotation:showExternal', this, this.model.get('item'));
    }

    onEditClicked(): void {
        explorerChannel.trigger('annotation:editAnnotation', this, this.model);
    }

    onNewClicked(): void {
        explorerChannel.trigger('annotation:newAnnotation', this, this.model);
    }
}

extend(AnnotationView.prototype, {
    className: 'annotation explorer-panel',
    template: annotationTemplate,
    subviews: [{
        view: 'lblView',
        selector: 'header aside',
    }, {
        view: 'itemMetadataView',
        selector: '.metadataContainer',
    }, {
        view: 'annotationMetadataView',
        selector: '.metadataContainer',
    }],
    events: {
        'click #btnRelItems': 'onRelItemsClicked',
        'click #btnAnnotations': 'onAnnotationsClicked',
        'click #btnExtResources': 'onExtResourcesClicked',
        'click .btn-edit': 'onEditClicked',
        'click #btnNewAnnotation': 'onNewClicked'
    },
});
