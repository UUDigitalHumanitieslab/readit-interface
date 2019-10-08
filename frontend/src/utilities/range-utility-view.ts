import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import * as rangy from 'rangy';
import 'rangy/lib/rangy-textrange';

import View from '../core/view';

export interface ViewOptions extends BaseOpt {
    sourceText: string;
    queryText: string;
}

/**
 * This View is a first attempt at extracting a Range based on
 * a text (i.e. get index details by matching strings).
 * It hides itself in its parent element.
 * Note that Rangy's 'findText' method utilized below,
 * searches the entire DOM until it finds the text: therefore
 * it is probably best to insert this View's element into #header.
 */
export default class RangeUtilityView extends View {
    sourceText: string;
    queryText: string;

    constructor(options: ViewOptions) {
        super(options);
        this.sourceText = options.sourceText;
        this.queryText = options.queryText;
    }

    render(): this {
        this.$el.html(this.sourceText);
        this.$el.css('height', '0px');
        this.$el.css('overflow', 'hidden');
        return this;
    }

    onInsertedIntoDOM(): this {
        rangy.init();
        let rr = rangy.createRangyRange();

        /**returns true if text was found */
        if (rr.findText(this.queryText)) {
            let startNodeIndex = this.getNodeIndex(rr.startContainer);
            let startCharacterIndex = rr.startOffset;
            let endNodeIndex = this.getNodeIndex(rr.endContainer);
            let endCharacterIndex = rr.endOffset;
        }

        return this;
    }

    /**
     * This is a quick and dirty implementation,
     * think of something nice if we actually start using this.
     */
    getNodeIndex(container: any): number {
        let index = 0;

        for (let child of this.$el.contents()) {
            if (child === container) {
                break;
            }

            index++;
        }

        return index;
    }

    onRemovedFromDOM(): this {
        return this;
    }

}
extend(RangeUtilityView.prototype, {
    tagName: 'div',
    className: '',
    events: {
        'DOMNodeInsertedIntoDocument': 'onInsertedIntoDOM',
        'DOMNodeRemoved': 'onRemovedFromDOM',
    }
});

