import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';

import Model from '../core/model';
import { CollectionView } from './../core/view';
import FlatAnnotations from '../core/flat-annotation-collection';
import OverlapItem from './overlap-item-view';
import detailsTemplate from './overlap-details-template';

export interface ViewOptions extends BaseOpt {
    collection: FlatAnnotations;
}

export default class OverlapDetailsView extends CollectionView<Model, OverlapItem> {
    collection: FlatAnnotations;

    initialize() {
        this.initItems().initCollectionEvents().render();
    }

    renderContainer(): this {
        this.$el.html(this.template({}));
        return this;
    }

    onCloseClicked() {
        this.trigger('closed');
    }
}

extend(OverlapDetailsView.prototype, {
    className: 'box overlap-details',
    template: detailsTemplate,
    container: 'ol',
    subview: OverlapItem,
    events: {
        'click .close': 'onCloseClicked'
    }
});
