import { extend } from 'lodash';

import View, { CollectionView } from '../core/view';
import FlatItem from '../common-adapters/flat-item-model';

/**
 * A line segment has a colored band for each associated annotation.
 */
class ColorBand extends View<FlatItem> {
    setClasses: string[];

    initialize({ model }): void {
        this.setClasses = [];
        if (model.complete) {
            this.completeInit();
        } else {
            this.listenToOnce(model, 'complete', this.completeInit);
        }
    }

    completeInit(): void {
        this.listenTo(this.model, 'change', this.updateClasses).updateClasses();
    }

    updateClasses(): void {
        this.$el.removeClass(this.setClasses);
        this.$el.addClass(this.setClasses = this.model.getFilterClasses());
    }
}

/**
 * As the name implies, a line segment is a segment of a line of text, i.e.,
 * text between two line breaks. It is rendered as a rectangle with horizontal
 * colored bands. Its `model` provides the CSS positioning while its
 * `collection` provides the CSS classes of the colored bands. It renders
 * automatically upon creation and will then keep the colored bands in sync
 * with the `collection`.
 */
export default class LineSegmentView extends CollectionView {
    initialize() {
        this.initItems().initCollectionEvents().render();
    }

    renderContainer(): this {
        this.$el.css(this.model.attributes);
        return this;
    }
}

extend(LineSegmentView.prototype, {
    subview: ColorBand,
});
