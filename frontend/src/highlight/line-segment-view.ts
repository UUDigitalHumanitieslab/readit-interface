import { extend } from 'lodash';

import View, { CollectionView } from '../core/view';

/**
 * A line segment has a colored band for each associated annotation.
 */
class ColorBand extends View {
    setClass: string;

    initialize({ model }): void {
        this.$el.addClass(model.get('cssClass'));
        this.listenTo(model, 'change:cssClass', this.onLabelChanged);
    }

    onLabelChanged(model, newCssClass): void {
        this.$el.removeClass(model.previous('cssClass'));
        this.$el.addClass(newCssClass);
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
