import { extend } from 'lodash';
import * as _ from 'underscore';
import View from '../core/view';

import annotationTemplate from './annotation-template';
import Annotation from './../models/annotation';


export default class AnnotationView extends View {
    private range: Range;

    private rect: ClientRect | DOMRect;

    constructor(rect: ClientRect | DOMRect, private cssClass: string, private correctionTop: number, private correctionLeft: number) {
        super();
        this.rect = rect;
    }

    /**
     * Keep track of leading and trailing whitespace
     * (required for correct reinsertion if annotation is deleted)
     */
    hasLeadingWhitespace: boolean = false;
    hasTrailingWhitespace: boolean = false;

    render(): View {
        // check multiline before inserting stuff
        // let isMultiline: boolean = this.range.getClientRects().length > 1;
        // 200 - 216 Donec quam felis

        this.$el.html(this.template({}));
        this.$el.addClass(this.cssClass);
        this.$el.addClass('anno');


        this.$el.css("position", 'absolute');
        this.$el.css("z-index", '-1');
        this.$el.css("top", this.rect.top + $(document).scrollTop().valueOf());
        this.$el.css("left", this.rect.left);
        this.$el.css("width", this.rect.width);
        this.$el.css("height", this.rect.height);

        this.positionDeleteButton(false);
        return this;
    }

    initialize(): void {

    }

    trackWhiteSpaces() {
        var div = document.createElement('div');        
        div.appendChild(this.range.cloneContents());
        var inputText = div.innerText;
        this.hasLeadingWhitespace = inputText.startsWith(' ');
        this.hasTrailingWhitespace = inputText.endsWith(' ');
    }

    /**
     * Position the delete icon dynamically for a multiline selection
     */
    positionDeleteButton(isMultiline: boolean) {
        let topCorrection = 14;
        let top = -Math.abs(topCorrection);

        if (isMultiline) {
            let upperLineTop = 0, bottomLineTop = undefined;

            for (let rect of this.range.getClientRects()) {
                if (rect.top > upperLineTop) {
                    upperLineTop = rect.top
                }

                if (!bottomLineTop) {
                    bottomLineTop = rect.top
                } else if (rect.top < bottomLineTop) {
                    bottomLineTop = rect.top
                }
            }

            top = upperLineTop - bottomLineTop - topCorrection;
        }

        this.$('.deleteAnno').css('top', `${top}px`)
    }

    onAnnoHover(event: any) {
        console.log('hover')
        this.$('.deleteAnno').css('display', 'block');
    }

    onAnnoHoverEnd(event: any) {
        this.$('.deleteAnno').css('display', 'none');
    }

    onDelete(event: any) {
        console.log('delete')
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