import { extend } from 'lodash';
import * as _ from 'underscore';
import View from '../core/view';

import annotationTemplate from './annotation-template';
import Annotation from './../models/annotation';

import AnnotationRectView from './annotation-rect-view';

export default class AnnotationView extends View {
    constructor(private range: Range, private annotationId: number, private cssClass: string) {
        super();
    }

    render(): View {
        this.$el.html(this.template({}));
        this.$el.addClass('anno');
        
        let index = 0;
        let rects = this.range.getClientRects()
        for (let rect of rects) {
            let isLast = index == rects.length - 1;
            
            let annoRect = new AnnotationRectView(rect, this.cssClass, isLast);
            annoRect.render().$el.appendTo(this.$el);

            index++;
        }

        this.positionDeleteButton(false);
        return this;
    }

    initialize(): void {

    }

    /**
     * Position the delete icon dynamically for a multiline selection / annotation
     */
    positionDeleteButton(isMultiline: boolean) {
        let topCorrection = 14;
        let top = -Math.abs(topCorrection);

        if (isMultiline) {
            let upperLineTop = 0, bottomLineTop = undefined;

            for (let rect of this.range.getClientRects()) {
                if (rect.top > upperLineTop) {
                    upperLineTop = rect.top;
                }

                if (!bottomLineTop) {
                    bottomLineTop = rect.top;
                } else if (rect.top < bottomLineTop) {
                    bottomLineTop = rect.top;
                }
            }

            top = upperLineTop - bottomLineTop - topCorrection;
        }

        this.$('.deleteAnno').css('top', `${top}px`);
    }

    onAnnoHover(event: any) {
        this.$('.deleteAnno').css('display', 'block');
    }

    onAnnoHoverEnd(event: any) {
        this.$('.deleteAnno').css('display', 'none');
    }

    onDelete(event: any) {
        this.trigger('annotationDeleted', this.annotationId)
    }
}
extend(AnnotationView.prototype, {
    tagName: 'anno',
    template: annotationTemplate,
    events: {
        'click .deleteAnno': 'onDelete',
        'mouseenter': 'onAnnoHover',
        'mouseleave': 'onAnnoHoverEnd',
    }
});