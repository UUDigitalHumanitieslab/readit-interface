import { ViewOptions as BaseOpt } from 'backbone';
import { extend, bind, debounce } from 'lodash';

import View from '../../core/view';
import { oa, rdf, vocab } from '../../jsonld/ns';
import Node from '../../jsonld/node';
import Graph from '../../jsonld/graph';

import { getCssClassName } from './../utilities';
import HighlightableTextTemplate from './highlightable-text-template';
import HighlightView from './highlight-view';

import ontology from './../../global/readit-ontology';


export interface ViewOptions extends BaseOpt<Node> {
    text: string;

    /**
     * Optional. A collection of oa:Annotation instances.
     */
    collection?: Graph;

    /**
     * Specify whether the View should only display oa:Annotations, or if it allows editing
     * them. Defaults to false.
     */
    isEditable: boolean;

    /**
     * Specify whether the oa:Annotations in collection should be
     * displayed when the View becomes visible. Defaults to false.
     */
    showHighlightsInitially: boolean;

    /**
     * Optional. The oa:Annotation instance, present in the collection / Graph, that
     * you want to scroll to after the annotation's highlight is added to the DOM.
     */
    initialScrollTo?: Node;
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
    showHighlightsInitially: boolean;

    /**
     * Store the oa:Annotation that needs to be scrolled to
     */
    scrollToNode: Node;

    hVs: HighlightView[] = [];

    isEditable: boolean;

    isInDOM: boolean;

    constructor(options?: ViewOptions) {
        super(options);
        if (options.initialScrollTo) {
            if (!this.isType(options.initialScrollTo, oa.Annotation)) {
                throw TypeError('initialScrollTo should be of type oa:Annotation');
            }
            options.showHighlightsInitially = true;
        }

        this.scrollToNode = options.initialScrollTo;
        this.text = options.text;
        this.isEditable = options.isEditable;
        this.showHighlightsInitially = options.showHighlightsInitially;

        if (!options.collection) this.collection = new Graph();
        this.collection.on('add', this.addHighlight, this);

        this.$el.on('scroll', debounce(bind(this.onScroll, this), 100));
    }

    render(): this {
        this.$el.html(this.template({ text: this.text }));
        return this;
    }

    onInsertedIntoDOM(): this {
        this.isInDOM = true;
        this.textWrapper = this.$('.textWrapper');

        if (this.text) {
            this.initHighlights();

            if (this.showHighlightsInitially) {
                this.showAll();
                this.scroll(this.scrollToNode);
            }
        }

        return this;
    }

    onRemovedFromDOM(): this {
        this.isInDOM = false;
        return this;
    }

    initHighlights(): this {
        this.collection.each((node) => {
            if (this.isType(node, oa.Annotation)) {
                if (this.isCompleteAnnotation(node, this.collection)) {
                    this.addHighlight(node);
                }
            }
        });

        return this;
    }

    /**
     * Add a new highlight to the text based on an instance of oa:Annotation.
     */
    add(node: Node): this {
        if (!this.isEditable) return;

        if (!this.isType(node, oa.Annotation)) {
            throw TypeError('node should be of type oa:Annotation');
        }

        if (this.isCompleteAnnotation(node, node.collection)) {
            let body = node.collection.get(node.get(oa.hasBody)[0]);
            let selector = node.collection.get(node.get(oa.hasTarget)[0]);
            let startSelector = node.collection.get(selector.get(oa.hasStartSelector)[0]);
            let endSelector = node.collection.get(selector.get(oa.hasEndSelector)[0]);
            this.collection.add([node, body, selector, startSelector, endSelector]);
        }

        return this;
    }

    /**
     * Remove all highlights from the text.
     */
    removeAll(): this {
        if (!this.isEditable) return;

        this.collection.each((node) => {
            if (this.isType(node, oa.Annotation)) {
                this.delete(node);
            }
        });
        return this;
    }

    /**
     * Show all annotations in the text.
     */
    showAll(): this {
        this.hVs.forEach((hV) => {
            hV.render().$el.prependTo(this.$('.position-container'));
        });
        return this;
    }

    /**
     * Hide all annotations.
     */
    hideAll(): this {
        this.hVs.forEach((hV) => {
            hV.$el.detach();
        });

        return this;
    }

    /**
     * Remove a single highlight.
     * @param annotation The instance of oa:Annotation to remove.
     */
    removeHighlight(annotation: Node) {
        this.delete(annotation);
    }

    private deleteFromCollection(annotation: Node): boolean {
        if (!this.isType(annotation, oa.Annotation)) return false;

        let selector = this.collection.get(annotation.get(oa.hasTarget)[0]);
        let startSelector = this.collection.get(selector.get(oa.hasStartSelector)[0]);
        let endSelector = this.collection.get(selector.get(oa.hasEndSelector)[0]);
        this.collection.remove([annotation, selector, startSelector, endSelector]);
        return true;
    }

    /**
     * Add a HighlightView to the current text.
     * @param node The Node to base the highlight on.
     */
    private addHighlight(node: Node): HighlightView {
        if (!this.isType(node, oa.Annotation)) return;

        // annotation styling details
        let body = ontology.get(node.get(oa.hasBody)[0]);
        let cssClass = getCssClassName(body);

        // annotation position details
        let specificResource = this.collection.get(node.get(oa.hasTarget)[0]);
        let selector = this.collection.get(specificResource.get(oa.hasSelector)[0]);
        let startSelector = this.collection.get(selector.get(oa.hasStartSelector)[0]);
        let endSelector = this.collection.get(selector.get(oa.hasEndSelector)[0]);

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
            relativeParent: this.$('.position-container'),
            isDeletable: this.isEditable
        });

        this.bindEvents(hV);
        this.hVs.push(hV);
        return hV;
    }

    /**
     * Get the node index from an XPathSelector
     * @param selector XPathSelector with a rdf:Value like 'substring(.//*[${nodeIndex}]/text(),${characterIndex})'
     */
    getNodeIndex(selector: Node): number {
        let xpath = selector.get(rdf.value)[0];
        let index = xpath.indexOf('[') + 1;
        let endIndex = xpath.indexOf(']');
        return +xpath.substring(index, endIndex);
    }

    /**
     * Get the character index from an XPathSelector
     * @param selector XPathSelector with a rdf:Value like 'substring(.//*[${nodeIndex}]/text(),${characterIndex})'
     */
    getCharacterIndex(selector: Node): any {
        let xpath = selector.get(rdf.value)[0];
        let startIndex = xpath.indexOf(',') + 1;
        let endIndex = xpath.length - 1;
        return xpath.substring(startIndex, endIndex);
    }

    /**
     * Validate if all related items required by a oa:Annotation instance are in a Graph.
     * Throws TypeError with appropriate message if they are not.
     * @param annotation The oa:Annotation instance to validate.
     * @param graph The Graph instance that should contain all related items
     */
    isCompleteAnnotation(annotation: Node, graph: Graph): boolean {
        if (!this.isType(annotation, oa.Annotation)) {
            throw new TypeError(
                `Node ${annotation.get('@id')} is not an instance of oa:Annotation`);
        }

        if (annotation.get(oa.hasBody).filter(n => ontology.get(n)).length < 1) {
            throw new TypeError(
                `The oa:hasBody property of annotation ${annotation.get('@id')} is empty or the related ontology item cannot be found`);
        }

        let specificResource = graph.get(annotation.get(oa.hasTarget)[0]);
        let selector = graph.get(specificResource.get(oa.hasSelector)[0]);

        if (!selector || !this.isType(selector, vocab('RangeSelector'))) {
            throw new TypeError(
                `Selector ${selector.get('@id')} cannot be empty and should be of type vocab('RangeSelector')`);
        }

        let startSelector = graph.get(selector.get(oa.hasStartSelector)[0]);
        if (!startSelector || !this.isType(startSelector, oa.XPathSelector)) {
            throw new TypeError(
                `StartSelector ${startSelector.get('@id')} cannot be empty and should be of type oa:XPathSelector`);
        }

        let endSelector = graph.get(selector.get(oa.hasEndSelector)[0]);
        if (!endSelector || !this.isType(endSelector, oa.XPathSelector)) {
            throw new TypeError(
                `EndSelector ${endSelector.get('@id')} cannot be empty and should be of type oa:XPathSelector`);
        }

        return true;
    }

    isType(node: Node, type: string) {
        return node.get('@type').includes(type);
    }

    /**
     * Initialize a 'virtual' Range object based on position details.
     * A Range, in this sense, is a highlighted area that, for example shows up when a user
     * selects a piece of text. Note that a Range may consist of multiple rectangles (i.e. when
     * the selection spans multiple lines).
     * @param textWrapper The element that has the full text (incl potential HTML) as its content
     * @param startNodeIndex The index of the element in which the Range should start. This element should be a textNode.
     * @param startCharacterIndex The index of the chararacter (in the startNode) at which the highligth should start.
     * @param endNodeIndex The index of the element in which the Range should end. This element should be a textNode.
     * @param endCharacterIndex The index of the chararacter (in the endNode) at which the highligth should start.
     */
    getRange(
        textWrapper: JQuery<HTMLElement>,
        startNodeIndex: number,
        startCharacterIndex: number,
        endNodeIndex: number,
        endCharacterIndex: number
    ): Range {
        let range = document.createRange();
        let startContainer = textWrapper.contents().eq(startNodeIndex).get(0);
        let endContainer = textWrapper.contents().eq(endNodeIndex).get(0);
        range.setStart(startContainer, startCharacterIndex);
        range.setEnd(endContainer, endCharacterIndex);
        return range;
    }

    /**
     * Find highlightView associated with instance of oa:Annotation,
     * and decide where to center the view (i.e. long highlight at top,
     * vertically centered otherwise).
     */
    private scroll(scrollToNode: Node): this {
        if (!scrollToNode) return this;
        let scrollToHv = this.hVs.find(hV => hV.model === scrollToNode);
        if (scrollToHv) {
            let scrollableEl = this.$el;
            let highlightHeight = scrollToHv.getHeight();
            let highlightTop = scrollToHv.getTop();

            if (highlightHeight >= scrollableEl.height()) {
                // show start at the top
                let top = highlightTop - scrollableEl.offset().top;
                scrollableEl.animate({ scrollTop: top }, 800);
            }
            else {
                // center it
                let centerOffset = (scrollableEl.height() - highlightHeight) / 2
                let top = highlightTop - scrollableEl.offset().top - centerOffset;
                scrollableEl.animate({ scrollTop: top }, 800);
            }
        }
        return this;
    }

    /**
     * Scroll to a particular highlight associated with an instance of oa:Annotation.
     */
    scrollTo(node: Node): this {
        if (!this.isType(node, oa.Annotation)) {
            throw TypeError('scrollTo should be of type oa:Annotation');
        }
        this.scrollToNode = node;
        if (this.isInDOM) this.scroll(node);
        return this;
    }

    bindEvents(hV: HighlightView): this {
        hV.on('hover', this.hover, this);
        hV.on('hoverEnd', this.hoverEnd, this);
        hV.on('delete', this.delete, this);
        hV.on('clicked', this.clicked, this);
        return this;
    }

    hover(node: Node): this {
        this.trigger('hover', node);
        return this;
    }

    hoverEnd(node: Node): this {
        this.trigger('hoverEnd', node);
        return this;
    }

    delete(node: Node): this {
        if (this.deleteFromCollection(node)) {
            this.hVs.find(hV => hV.model === node).$el.detach();
            this.trigger('delete', node);
        }
        return this;
    }

    clicked(node: Node): this {
        this.trigger('clicked', node);
        return this;
    }

    onTextSelected(): void {
        if (!this.isEditable) return;

        let selection = window.getSelection();
        let range = selection.getRangeAt(0).cloneRange();

        // Ignore empty selections
        if (range.startOffset === range.endOffset) return;
        this.trigger('selected', range);
    }

    onScroll(): void {
        this.trigger('scroll', this, this.$el.scrollTop());
    }
}
extend(HighlightableTextView.prototype, {
    tagName: 'div',
    className: 'highlightable-text',
    template: HighlightableTextTemplate,
    events: {
        'DOMNodeInsertedIntoDocument': 'onInsertedIntoDOM',
        'DOMNodeRemoved': 'onRemovedFromDOM',
        'mouseup': 'onTextSelected',
    }
});
