import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';

import View from '../../core/view';
import { oa, rdf, item, vocab } from '../../jsonld/ns';
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
    textWrapper: JQuery<HTMLElement>;
    collection: Graph;
    scrollToNode: Node;
    isEditable: boolean;

    constructor(options?: ViewOptions) {
        super(options);
        this.text = options.text;
        this.isEditable = options.isEditable;

        // TODO: validate scrollTo type
        // TODO: validate scrollTo presence(s) in Graph

        this.scrollToNode = options.scrollTo;

        this.collection.on('add', this.addHighlight, this);
    }

    render(): this {
        this.$el.html(this.template({ text: this.text }));
        return this;
    }

    insertedIntoDOM(): this {
        this.textWrapper = this.$('.textWrapper');

        if (this.text) {
            this.initHighlights();
        }
        return this;
    }

    initHighlights(): this {
        let scrollToHv = null;

        this.collection.each((node) => {
            if (node.get('@type') == oa.Annotation) {
                if (this.isCompleteAnnotation(node, this.collection)) {
                    let hV = this.addHighlight(node);

                    if (this.scrollToNode == node) {
                        scrollToHv = hV;
                    }
                }
            }
        });

        this.scroll(scrollToHv);
        return this;
    }

    /**
     * Add a new highlight to the text based on an annotation.
     * @param graph A Graph containing an instance of oa:Annotation including all required related items:
     *      - an instance of the category (e.g. Content, Reader, ect)
     *      - an instance of oa:SpecificResource (i.e. the annnotation's hasTarget)
     *      - an instance of vocab('RangeSelector')
     *      - a StartSelector of type oa.XPathSelector
     *      - an EndSelector of type oa.XPathSelector
     */
    add(graph: Graph): this {
        graph.each((node) => {
            if (node.get('@type') == oa.Annotation) {
                if (this.isCompleteAnnotation(node, graph)) {
                    // TODO: update this when new Node functionality is available
                    let body = this.getNode(node.get(oa.hasBody)[0]['@id'], graph);
                    let selector = this.getNode(node.get(oa.hasTarget)[0]['@id'], graph);
                    let startSelector = this.getNode(selector.get(oa.hasStartSelector)[0]['@id'], graph);
                    let endSelector = this.getNode(selector.get(oa.hasEndSelector)[0]['@id'], graph);

                    this.collection.add([node, body, selector, startSelector, endSelector]);
                }
            }
        });

        return this;
    }

    private deleteFromCollection(annotation: Node) {
        // TODO: update this when new Node functionality is available
        let body = this.getNode(annotation.get(oa.hasBody)[0]['@id'], this.collection);
        let selector = this.getNode(annotation.get(oa.hasTarget)[0]['@id'], this.collection);
        let startSelector = this.getNode(selector.get(oa.hasStartSelector)[0]['@id'], this.collection);
        let endSelector = this.getNode(selector.get(oa.hasEndSelector)[0]['@id'], this.collection);
        this.collection.remove([annotation, body, selector, startSelector, endSelector]);
    }

    /**
     * Add a HighlightView to the current text.
     * @param node The Node to base the highlight on. Note that all required related items should already be in the Graph.
     */
    private addHighlight(node: Node): HighlightView {
        if (!this.isType(node, oa.Annotation)) return;

        // TODO: update this when new Node functionality is available
        // annotation styling details
        let body = this.getNode(node.get(oa.hasBody)[0]['@id'], this.collection);
        let cssClass = getCssClassName(body);

        // annotation position details
        let selector = this.getNode(node.get(oa.hasTarget)[0]['@id'], this.collection);
        let startSelector = this.getNode(selector.get(oa.hasStartSelector)[0]['@id'], this.collection);
        let endSelector = this.getNode(selector.get(oa.hasEndSelector)[0]['@id'], this.collection);

        let range = this.getRange(
            this.textWrapper,
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
        this.bindEvents(hV);
        hV.render().$el.prependTo(this.$el);
        return hV;
    }

    /**
     * Get the node index from an XPathSelector
     * @param selector XPathSelector with a rdf:Value like 'substring(.//*[${nodeIndex}]/text(),${characterIndex})'
     */
    getNodeIndex(selector: Node): number {
        let xpath = selector.get(rdf.value);
        let index = xpath.indexOf('[') + 1;
        let endIndex = xpath.indexOf(']');
        return +xpath.substring(index, endIndex);
    }

    /**
     * Get the character index from an XPathSelector
     * @param selector XPathSelector with a rdf:Value like 'substring(.//*[${nodeIndex}]/text(),${characterIndex})'
     */
    getCharacterIndex(selector: Node): any {
        let xpath = selector.get(rdf.value);
        let startIndex = xpath.indexOf(',') + 1;
        let endIndex = xpath.length - 1;
        return xpath.substring(startIndex, endIndex);
    }

    /**
     * Validate if all related items required by a oa:Annotation instance are in a Graph.
     * Throws TypeError with proper message if they are not.
     * @param annotation The oa:Annotation instance to validate.
     * @param graph The Graph instance that should contain all related items
     */
    isCompleteAnnotation(annotation: Node, graph: Graph): boolean {
        if (!this.isType(annotation, oa.Annotation)) {
            throw new TypeError(
                `Node ${annotation.get('@id')} is not an instance of oa:Annotation`);
        }

        //TODO: rewrite when new Node functionality is available
        if (!this.getNode(annotation.get(oa.hasBody)[0]['@id'], graph)) {
            throw new TypeError(
                `The oa:hasBody property of annotation ${annotation.get('@id')} is empty or the related item cannot be found`);
        }

        let selector = this.getNode(annotation.get(oa.hasTarget)[0]['@id'], graph);
        if (!selector || this.isType(selector, vocab('RangeSelector'))) {
            throw new TypeError(
                `Selector ${selector.get('@id')} cannot be empty and should be of type vocab('RangeSelector')`);
        }

        let startSelector = this.getNode(selector.get(oa.hasStartSelector)[0]['@id'], graph);
        if (!startSelector || !this.isType(startSelector, oa.XPathSelector)) {
            throw new TypeError(
                `StartSelector ${startSelector.get('@id')} cannot be empty and should be of type oa:XPathSelector`);
        }

        let endSelector = this.getNode(selector.get(oa.hasEndSelector)[0]['@id'], graph);
        if (!endSelector || !this.isType(endSelector, oa.XPathSelector)) {
            throw new TypeError(
                `EndSelector ${endSelector.get('@id')} cannot be empty and should be of type oa:XPathSelector`);
        }

        return true;
    }

    isType(node: Node, type: string) {
        return node.get('@type').includes(type);
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

    onTextSelected(): void {
        if (!this.isEditable) return;

        let selection = window.getSelection();
        let range = selection.getRangeAt(0).cloneRange();

        // Ignore empty selections
        if (range.startOffset === range.endOffset) return;
        // Pass selected text to listeners
        // TODO: update what is passed: at least add nodeIndex and CharacterIndex,
        // but preferably a Graph that contains a complete oa:Annotation (i.e. with all related nodes)
        this.trigger('selected', range.cloneContents().textContent);
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

    bindEvents(hV: HighlightView): this {
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
        this.deleteFromCollection(node);
        this.trigger('delete', node);
        return this;
    }

    onClicked(node: Node): this {
        this.trigger('clicked', node);
        return this;
    }

    getNode(id: string, graph: Graph): Node {
        return graph.find(n => n.get('@id') === id);
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
