import { extend } from 'lodash';
import * as i18next from 'i18next';

import View from '../core/view';
import FlatItem from '../common-adapters/flat-item-model';

import snippetTemplate from './snippet-template';

export default class SnippetView extends View<FlatItem> {
    ellipsis = i18next.t('interpunction.paragraph_ellipsis', '(...)');
    trimmedTitle: boolean;
    trimmedStart: boolean;
    trimmedEnd: boolean;

    title_calc: string;
    prefix_calc: string;
    exact_calc: string;
    suffix_calc: string;

    canvasCtx: CanvasRenderingContext2D;
    availableWidth: number;

    isInDom: boolean;

    initialize(): this {
        this.listenTo(this.model, 'change', this.createContent);
        return this;
    }

    render(): this {
        this.$el.html(this.template(this));
        return this;
    }

    activate(): this {
        this.isInDom = true;
        this.createContent();
        return this;
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
        const title = this.model.get('title');
        if (title) {
            // if title is longer than available space (subtract 25 to compensate for strong)
            if (this.getLengthInPixels(title) > this.availableWidth - 25) {
                // trim to fit (subtract 25 compensating for strong and another 25 for ellipses)
                this.title_calc = this.trimToFit(title, this.availableWidth - 50);
                this.trimmedTitle = true;
            }
            else this.title_calc = title;
        }
        return this;
    }

    setText(): this {
        // subtract 100 to compensate for ellipses
        const availableSpace = (3 * this.availableWidth) - 100;
        const prefix = this.model.get('prefix') as string || '';
        const exact = this.model.get('text') as string || '';
        const suffix = this.model.get('suffix') as string || '';
        const fullString = `${prefix}${exact}${suffix}`;

        if (this.getLengthInPixels(fullString) < availableSpace) {
            this.prefix_calc = prefix;
            this.exact_calc = exact;
            this.suffix_calc = suffix;
        } else {
            if (!prefix) {
                this.prefix_calc = "";
            } else {
                this.prefix_calc = this.trimToFit(prefix, availableSpace / 4, true);
                this.trimmedStart = true;
            }

            if (this.getLengthInPixels(exact) <= availableSpace / 2.5) {
                this.exact_calc = exact;
            } else {
                this.exact_calc = `${this.trimToFit(exact, availableSpace / 4)}
                ${this.ellipsis} ${this.trimToFit(exact, availableSpace / 4, true)}`;
            }

            if (!suffix) {
                this.suffix_calc = "";
            } else {
                this.suffix_calc = this.trimToFit(suffix, availableSpace / 4);
                this.trimmedEnd = true;
            }
        }

        return this;
    }

    /**
     * Trim characters from a string until its length in pixels is smaller than width.
     */
    trimToFit(text: string, width: number, fromStart: boolean = false): string {
        let trimmed: string = text;
        width = Math.max(width, 1);
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
});
