import { extend } from 'lodash';
import * as _ from 'underscore';
import View from '../core/view';

import annotationRectTemplate from './annotation-rect-template';
import Annotation from './../models/annotation';


export default class AnnotationRectView extends View {
    
    constructor(private rect: ClientRect | DOMRect, private cssClass: string, private isLast: boolean) {
        super();
        this.rect = rect;
    }
    
    render(): View {
        this.$el.html(this.template({ isLast: this.isLast }));

        this.$el.addClass(this.cssClass);
        this.$el.addClass('anno-rect');

        this.$el.css("top", this.rect.top + $(document).scrollTop().valueOf());
        this.$el.css("left", this.rect.left);
        this.$el.css("width", this.rect.width);
        this.$el.css("height", this.rect.height);

        return this;
    }

    initialize(): void {

    }
}
extend(AnnotationRectView.prototype, {
    tagName: 'anno-rect',
    template: annotationRectTemplate,
    events: {
    }
});