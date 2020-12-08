import { constant, extend } from 'lodash';
import { ViewOptions as BViewOptions } from 'backbone';

import Model from '../core/model';
import { CollectionView } from '../core/view';
import SegmentModel from '../highlight/text-segment-model';
import SegmentCollection from '../highlight/text-segment-collection';
import SegmentView from '../highlight/text-segment-view';

// Required options for HighlightLayerView.
export interface ViewOptions extends BViewOptions {
    textContainer: JQuery<HTMLElement>;
    collection: SegmentCollection;
}

/**
 * The highlight layer that is placed behind the text layer in the source panel.
 *
 * IMPORTANT: the `render` method has the precondition that the view's `.el` is
 * attached to the `document` and that the `textContainer` is visible.
 */
export default class HighlightLayerView extends CollectionView<Model, SegmentView> {
    textContainer: JQuery<HTMLElement>;
    // offset: JQuery.Coordinates;
    collection: SegmentCollection;

    constructor(options: ViewOptions) { super(options); }

    initialize(options: ViewOptions) {
        this.textContainer = options.textContainer;
        this.items = [];
    }

    beforeRender(): this {
        // this.offset = this.$el.offset();
        this.initItems().initCollectionEvents();
        this.beforeRender = constant(this);
        return this;
    }

    makeItem(model: SegmentModel): SegmentView {
        return new SegmentView({
            model,
            textContainer: this.textContainer,
            offset: this.el,
        }).activate().on('all', this.trigger, this);
    }
}

extend(HighlightLayerView.prototype, {
    className: 'rit-highlight-layer',
});
