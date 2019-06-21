import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';

import View from '../../core/view';

import Node from '../../jsonld/node';
import Graph from '../../jsonld/graph';

import HighlightableTextTample from './highlightable-text-template';
import HighlightView from './highlight-view';

export interface ViewOptions extends BaseOpt<Node> {
    text: string;

    /**
     * Collection of 'oa:Annotation' instances to be used as initial highlights
     */
    collection: Graph;

    /**
     * Specify whether the text should be editable.
     */
    isEditable: boolean;
}

/**
 * A View that enables highlighting in a given text.
 * Important note: each highlight is based on a Range.
 * As a consequence thereof, the coordinates (i.e. positions) of the
 * Range's rectangles can only be correctly calculated AFTER this View
 * is inserted into the DOM. It listens for that event itself, but keep it in mind.
 */
export default class HighlightableTextView extends View {
    text: string;

    /**
     * Collection of 'oa:Annotation' instances to be used as initial highlights
     */
    collection: Graph;

    /**
     * Specify whether the text should be editable.
     */
    isEditable: boolean;

    // TODO: add scrollTo?

    constructor(options?: ViewOptions) {
        super(options);
        this.text = options.text;
        this.isEditable = options.isEditable;
    }

    render(): this {
        this.$el.html(this.template({ text: this.text }));

        return this;
    }

    insertedIntoDOM(): this {
        this.initHighlights();
        return this;
    }

    initHighlights(): this {
        if (this.text) {
            this.collection.each(( node ) => {
                this.addHighlight(node);
            });
        }

        return this;
    }

    addHighlight(node: Node): this {
        let cssClass = 'is-readit-content';
        let textWrapper = this.$('.textWrapper');

        // TODO: get indices and CSS class from node
        let range = this.getRange(textWrapper, 0, 5, 3, 15);
        let annoView = new HighlightView({
            model: node,
            range: range,
            cssClass: cssClass,
            relativeParent: this.$el,
            isDeletable: this.isEditable
        });
        annoView.render().$el.prependTo(this.$el);
        return this;
    }


    getRange(
        textWrapper: JQuery<HTMLElement>,
        startContainerIndex: number,
        startIndex: number,
        endContainerIndex: number,
        endIndex: number
    ): Range {
        let range = document.createRange();
        let startContainer = textWrapper.contents().eq(startContainerIndex).get(0);
        let endContainer = textWrapper.contents().eq(endContainerIndex).get(0);
        range.setStart(startContainer, startIndex);
        range.setEnd(endContainer, endIndex);
        return range;
    }

    onTextSelected(event: any): void {
        if (!this.isEditable) return;

        let selection = window.getSelection();
        let range = selection.getRangeAt(0).cloneRange();

        // Ignore empty selections
        if (range.startOffset === range.endOffset) return;

        // TODO: throw event with selection (perhaps in annotation format)
        alert('Did you just select text???');
    }
}
extend(HighlightableTextView.prototype, {
    tagName: 'highlightable-text',
    className: 'highlightable-text',
    template: HighlightableTextTample,
    events: {
        'DOMNodeInsertedIntoDocument': 'insertedIntoDOM',
        'mouseup': 'onTextSelected',
    }
});
