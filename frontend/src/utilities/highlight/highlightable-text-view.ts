import { ViewOptions as BaseOpt } from 'backbone';
import { extend, bind, debounce, sortBy } from 'lodash';

import View from '../../core/view';
import { oa } from '../../jsonld/ns';
import Node from '../../jsonld/node';
import Graph from '../../jsonld/graph';

import { isType } from './../utilities';
import { validateCompleteness, getPositionDetails, getLinkedItems, getCssClassName, getSelector } from './../annotation-utilities';
import HighlightableTextTemplate from './highlightable-text-template';
import HighlightView from './highlight-view';

export interface ViewOptions extends BaseOpt<Node> {
    text: string;

    /**
     * Optional. A collection of oa:Annotation instances.
     */
    collection?: Graph;

    /**
     * The Read IT ontology.
     */
    ontology: Graph;

    /**
     * Specify whether the View should only display oa:Annotations, or if it allows editing
     * them. Defaults to false.
     */
    isEditable?: boolean;

    /**
     * Specify whether the oa:Annotations in collection should be
     * displayed when the View becomes visible.
     * Defaults to false but will be true if initialScrollTo is set.
     */
    showHighlightsInitially?: boolean;

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
    ontology: Graph;
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
            if (!isType(options.initialScrollTo, oa.Annotation)) {
                throw TypeError('initialScrollTo should be of type oa:Annotation');
            }
            options.showHighlightsInitially = true;
        }

        this.scrollToNode = options.initialScrollTo;
        this.text = options.text;
        this.ontology = options.ontology;
        this.isEditable = options.isEditable || false;
        this.showHighlightsInitially = options.showHighlightsInitially || false;

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
            if (isType(node, oa.Annotation)) {
                validateCompleteness(node);
                this.addHighlight(node);
            }
        });

        return this;
    }

    /**
     * Add a new highlight to the text based on an instance of oa:Annotation.
     */
    add(node: Node): this {
        if (!this.isEditable) return;

        if (!isType(node, oa.Annotation)) {
            throw TypeError('node should be of type oa:Annotation');
        }

        validateCompleteness(node);
        this.collection.add([node].concat(getLinkedItems(node)));

        return this;
    }

    /**
     * Remove all highlights from the text.
     */
    removeAll(): this {
        if (!this.isEditable) return;

        this.collection.each((node) => {
            if (isType(node, oa.Annotation)) {
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
        if (!isType(annotation, oa.Annotation)) return false;
        this.collection.remove([annotation].concat(getLinkedItems(annotation)));
        return true;
    }

    /**
     * Add a HighlightView to the current text.
     * @param node The Node to base the highlight on.
     */
    private addHighlight(node: Node): HighlightView {
        if (!isType(node, oa.Annotation)) return;

        // annotation styling details
        let cssClass = getCssClassName(node, this.ontology);

        // annotation position details
        let posDetails = getPositionDetails(node);

        let range = this.getRange(
            this.textWrapper,
            posDetails.startNodeIndex,
            posDetails.startCharacterIndex,
            posDetails.endNodeIndex,
            posDetails.endCharacterIndex
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
        if (!isType(node, oa.Annotation)) {
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

    /**
     * Handles scroll events and re-emits them
     * If applicable, this will include the 'oa:Selector` currently visible.
     */
    onScroll(): void {
        let scrollableEl = this.$el;
        let scrollableVisibleMiddle = scrollableEl.offset().top + (scrollableEl.height() / 2 );
        let resultAnnotation = undefined;
        let visibleHighlights = this.getVisibleHighlightViews();

        if (!this.hVs || this.hVs.length === 0) {
            this.trigger('scroll');
        }

        if (!visibleHighlights || visibleHighlights.length === 0) {
            resultAnnotation = this.getHighlightClosestTo(scrollableVisibleMiddle, this.hVs).model;
        }
        else if (visibleHighlights.length === 1) {
            resultAnnotation = visibleHighlights[0].model;
        }
        else {
            resultAnnotation = this.getHighlightClosestTo(scrollableVisibleMiddle, visibleHighlights).model;
        }

        let selector = getSelector(resultAnnotation);
        this.trigger('scroll', selector);
    }

    getVisibleHighlightViews(): HighlightView[] {
        let scrollableEl = this.$el;
        let scrollableTop = scrollableEl.offset().top;
        let scrollableBottom = scrollableTop + scrollableEl.height();

        let visibleHighlights = this.hVs.filter( (hV) => {
            let top = hV.getTop();
            let bottom = top + hV.getHeight();
            return bottom > scrollableTop && top < scrollableBottom;
        });

        return visibleHighlights;
    }

    getHighlightClosestTo(referenceValue: number, highlightViews: HighlightView[]): HighlightView {
        return sortBy(highlightViews, (h) => Math.abs(referenceValue - h.$el.offset().top))[0];
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
