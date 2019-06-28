import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';

import View from '../../core/view';
import { oa, rdf, item } from '../../jsonld/ns';
import Node from '../../jsonld/node';
import Graph from '../../jsonld/graph';

import { getCssClassName } from './../utilities';
import HighlightableTextTample from './highlightable-text-template';
import HighlightView from './highlight-view';


export interface ViewOptions extends BaseOpt<Node> {
    text: string;

    collection: Graph;

    /**
     * Optional. The oa:Annotation instance, present in the collection / Graph that
     * you want to scroll to after the annotation's highlight is added to the DOM.
     * Note that the HighlightableTextView will not scroll itself:
     * it will throw an event ('scrollToReady') with the details that you
     * need to perform the desired scroll, i.e. top and height of the highlight.
     * Note that these are coordinates relative to the documents' (!) 0,0 coordinates,
     * so you wil have to calculate how much to scroll from there (e.g. most likely
     * subtract the offset().top of the scrollable element).
     */
    scrollTo: Node;

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
    collection: Graph;
    scrollToNode: Node;
    isEditable: boolean;

    constructor(options?: ViewOptions) {
        super(options);
        this.text = options.text;
        this.isEditable = options.isEditable;

        // TODO: validate scrollTo type
        // TODO: validate scroll to presence(s) in Graph

        this.scrollToNode = options.scrollTo;
    }

    render(): this {
        this.$el.html(this.template({ text: this.text }));
        return this;
    }

    insertedIntoDOM(): this {
        if (this.text) {
            this.initHighlights();
        }
        return this;
    }

    initHighlights(): this {
        let scrollToHv = null;

        this.collection.each((node) => {
            if (node.get('@type') == oa.Annotation) {
                let hV = this.addHighlight(node);

                if (this.scrollToNode == node) {
                    scrollToHv = hV;
                }
            }
        });

        this.scroll(scrollToHv);
        return this;
    }

    // TODO: add method to add a new annotation (which would take a Graph with all details)

    addHighlight(node: Node): HighlightView {
        // TODO: check if Node has properties we need (and everything is present in Graph)

        let textWrapper = this.$('.textWrapper');

        // annotation styling details
        let body = this.getNode(node.get(oa.hasBody)[0]['@id']);
        let cssClass = getCssClassName(body);

        // annotation position details
        let selector = this.getNode(node.get(oa.hasTarget)[0]['@id']);
        let startSelector = this.getNode(selector.get(oa.hasStartSelector)[0]['@id']);
        let endSelector = this.getNode(selector.get(oa.hasEndSelector)[0]['@id']);

        let range = this.getRange(
            textWrapper,
            this.getNodeIndex(startSelector),
            this.getCharacterIndex(startSelector),
            this.getNodeIndex(endSelector),
            this.getCharacterIndex(endSelector)
        );
        let hV = new HighlightView({
            model: node,
            range: range,
            cssClass: cssClass,
            relativeParent: this.$el,
            isDeletable: this.isEditable
        });
        hV.render().$el.prependTo(this.$el);
        return hV;
    }

    /**
     * Trigger 'scrollToReady' event, passing highlightView's
     * top position and height to subscribers.
     * Note that these are coordinates relative to the documents' (!) 0,0 coordinates,
     * so you wil have to calculate how much to scroll from there (e.g. most likely
     * subtract the offset().top of the scrollable element).
     * @param scrollToHV The highlightView to scroll to.
     */
    scroll(scrollToHV: HighlightView): this {
        if (scrollToHV) {
            this.trigger('scrollToReady', scrollToHV.getTop(), scrollToHV.getHeight());
        }
        return this;
    }

    getNodeIndex(selector: Node): number {
        let xpath = selector.get(rdf.value);
        let index = xpath.indexOf('[') + 1;
        let endIndex = xpath.indexOf(']');
        return +xpath.substring(index, endIndex);
    }

    getCharacterIndex(selector: Node): any {
        let xpath = selector.get(rdf.value);
        let startIndex = xpath.indexOf(',') + 1;
        let endIndex = xpath.length - 1;
        return xpath.substring(startIndex, endIndex);
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

    bindHvEvents(hV: HighlightView): this {
        hV.on('hover', this.onHover, this);
        hV.on('hoverEnd', this.onHoverEnd, this);
        hV.on('delete', this.onDelete, this);
        hV.on('clicked', this.onClicked, this);
        return this;
    }

    onHover(node: Node): this {
        this.trigger('hover', node);
        return this;
    }

    onHoverEnd(node: Node): this {
        this.trigger('hoverEnd', node);
        return this;
    }

    onDelete(node: Node): this {
        this.trigger('delete', node);
        return this;
    }

    onClicked(node: Node): this {
        this.trigger('clicked', node);
        return this;
    }

    getNode(id: string): Node {
        return this.collection.find(n => n.get('@id') === id);
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
