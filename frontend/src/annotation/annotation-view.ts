import { extend } from 'lodash';
import * as _ from 'underscore';
import View from '../core/view';

import annotationTemplate from './annotation-template';


export default class AnnotationView extends View {
    content: DocumentFragment
    cssClass: string;

    constructor(content: DocumentFragment, cssClass: string) {
        super()        
        this.content = content;
        this.cssClass = cssClass;
    }
    
    render(): View {
        this.$el.html(this.template({}));
        this.$el.prepend(this.content);
        this.$el.addClass('anno');
        this.$el.addClass(this.cssClass);
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
        event.stopPropagation();
        this.trigger('onDelete')
    }

}
extend(AnnotationView.prototype, {
    tagName: 'anno',
    template: annotationTemplate,
    events: {
        'click .deleteAnno': 'onDelete',
        'mouseenter': 'onAnnoHover',
        'mouseleave': 'onAnnoHoverEnd'
    }
});