import { each, mapValues, extend, includes } from 'lodash';
import * as i18next from 'i18next';

import Model from '../core/model';
import { CompositeView } from '../core/view';
import Subject, { isSubject } from '../common-rdf/subject';
import FlatItem from '../common-adapters/flat-item-model';
import FlatCollection from '../common-adapters/flat-annotation-collection';
import explorerChannel from '../explorer/explorer-radio';
import { report404 } from '../explorer/utilities';
import { getLabelText } from '../utilities/annotation-utilities';
import LabelView from '../label/label-view';
import excludedProperties from '../item-metadata/excluded-properties';
import ItemMetadataView from '../item-metadata/item-metadata-view';
import { prepareTooltipData, bulkAttachTooltips } from '../tooltip/utilities';
import { getLabelFromId } from '../utilities/linked-data-utilities';

import { announceRoute } from './utilities';
import annotationTemplate from './annotation-template';

const tooltips = prepareTooltipData({
    'left .btn-related': [
        // i18next.t('tooltip.open-related')
        'tooltip.open-related',
        'View items that are related to the current item',
    ],
    'left .btn-annotations': [
        // i18next.t('tooltip.open-annotations')
        'tooltip.open-annotations',
        'View all places where this item has been annotated',
    ],
    'left .btn-external': [
        // i18next.t('tooltip.open-external')
        'tooltip.open-external',
        'View links to external resources about this item',
    ],
    'top .btn-edit': [
        // i18next.t('tooltip.edit-annotation')
        'tooltip.edit-annotation',
        'Change the properties of this item',
    ],
    'top .btn-new': [
        // i18next.t('tooltip.clone-annotation')
        'tooltip.clone-annotation',
        'Create a new annotation at the same position',
    ],
});

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
        bulkAttachTooltips(this, tooltips);
    }

    processAnnotation(model: FlatItem, annotation: Subject): void {
        this.dispose('annotationMetadataView');
        if (annotation) {
            this.annotationMetadataView = new ItemMetadataView({
                model: annotation,
                title: i18next.t('annotation.metadata-title', 'Annotation metadata')
            });
        }
    }

    processClass(model: FlatItem, cls: Subject): void {
        this.dispose('lblView');
        if (cls) this.lblView = new LabelView({model, toolTipSetting: 'left'});
    }

    processItem(model: FlatItem, item: Subject): void {
        this.dispose('itemMetadataView');
        const previousItem = model.previous('item');
        if (previousItem) this.stopListening(previousItem);
        if (item) {
            this.itemMetadataView = new ItemMetadataView({
                model: item,
            });
            this.listenTo(item, 'change', this.collectDetails)
                .collectDetails(item);
            this.listenTo(item, 'change', this.render);
        }
    }

    collectDetails(item: Subject): void {
        this.properties = {};
        for (let attribute in item.attributes) {
            if (includes(excludedProperties, attribute)) continue;
            let attributeLabel = getLabelFromId(attribute);
            let valueArray = item.get(attribute);
            valueArray.forEach(value => {
                if (!isSubject(value)) {
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
        'click .btn-related': 'onRelItemsClicked',
        'click .btn-annotations': 'onAnnotationsClicked',
        'click .btn-external': 'onExtResourcesClicked',
        'click .btn-edit': 'onEditClicked',
        'click .btn-new': 'onNewClicked'
    },
});
