import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from '../../core/view';

import snippetTemplate from './snippet-template';
import Node from '../../jsonld/node';
import { oa } from './../../jsonld/ns';
import { isType } from '../utilities';

export interface ViewOptions extends BaseOpt {
    title?: string;
    selector: Node;
}

export default class SnippetView extends View {
    ellipsis = "(...)";
    trimmedTitle: boolean;
    trimmedStart: boolean;
    trimmedEnd: boolean;

    title?: string;
    selector: Node;

    title_calc: string;
    prefix_calc: string;
    exact_calc: string;
    suffix_calc: string;

    canvasCtx: CanvasRenderingContext2D;
    availableWidth: number;

    isInDom: boolean;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        if (!isType(options.selector, oa.TextQuoteSelector)) {
            throw new TypeError('selector must be of type oa:TextQuoteSelector');
        }

        this.title = options.title;
        this.selector = options.selector;
        this.listenTo(this.selector, 'change', this.createContent);
        return this;
    }

    render(): this {
        this.$el.html(this.template(this));
        return this;
    }

    handleDOMMutation(isInDOM: boolean): this {
        if (isInDOM) this.onInsertedIntoDOM();
        else this.onRemovedFromDOM();
        return this;
    }

    onInsertedIntoDOM(): any {
        this.isInDom = true;
        this.createContent();
    }

    onRemovedFromDOM(): any {
        this.isInDom = false;
    }

    createContent(): this {
        if (!this.isInDom) return;
        this.availableWidth = this.$el.width();

        if (!this.canvasCtx) {
            let c = <HTMLCanvasElement>document.createElement("CANVAS");
            this.canvasCtx = c.getContext("2d");
            this.canvasCtx.font = `${this.$el.css('font-size')} ${this.$el.css('font-family')}`
        }

        this.setTitle();
        this.setText();
        return this.render();
    }

    setTitle(): this {
        if (this.title) {
            // if title is longer than available space (subtract 25 to compensate for strong)
            if (this.getLengthInPixels(this.title) > this.availableWidth - 25) {
                // trim to fit (subtract 25 compensating for strong and another 25 for ellipses)
                this.title_calc = this.trimToFit(this.title, this.availableWidth - 50);
                this.trimmedTitle = true;
            }
            else this.title_calc = this.title;
        }
        return this;
    }

    setText(): this {
        // subtract 100 to compensate for ellipses
        let availableSpace = (3 * this.availableWidth) - 100;
        let prefix = this.selector.get(oa.prefix)[0] as string;
        let exact = this.selector.get(oa.exact)[0] as string;
        let suffix = this.selector.get(oa.suffix)[0] as string;
        let fullString = `${prefix}${exact}${suffix}`;

        if (this.getLengthInPixels(fullString) < availableSpace) {
            this.prefix_calc = prefix;
            this.exact_calc = exact;
            this.suffix_calc = suffix;
        }
        else {
            this.prefix_calc = this.trimToFit(prefix, availableSpace / 4, true);
            this.trimmedStart = true;
            this.exact_calc = `${this.trimToFit(exact, availableSpace / 4)}
                ${this.ellipsis} ${this.trimToFit(exact, availableSpace / 4, true)}`;
            this.suffix_calc = this.trimToFit(suffix, availableSpace / 4);
            this.trimmedEnd = true;
        }

        return this;
    }

    /**
     * Trim characters from a string until its length in pixels is smaller than width.
     */
    trimToFit(text: string, width: number, fromStart: boolean = false): string {
        let trimmed: string = text;
        while (this.getLengthInPixels(trimmed) > width) {
            trimmed = this.trimCharacter(trimmed, fromStart);
        }
        return trimmed;
    }

    /**
     * Trim a character from either the start or the end of a string.
     */
    trimCharacter(text: string, fromStart: boolean = false): string {
        if (fromStart) return text.substring(1, text.length);
        return text.substring(0, text.length - 1);
    }

    /**
     * Get the length of a string in pixels.
     */
    getLengthInPixels(text: string): number {

        return this.canvasCtx.measureText(text).width;
    }
}
extend(SnippetView.prototype, {
    tagName: 'div',
    className: 'snippet',
    template: snippetTemplate,
    events: {
    }
});
