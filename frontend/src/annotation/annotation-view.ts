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
        
        return this;
    }

    initialize(): void {

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