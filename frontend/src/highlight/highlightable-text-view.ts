import { ViewOptions as BaseOpt } from 'backbone';
import { extend, bind, debounce, sortBy } from 'lodash';
import { each } from 'async';

import View from './../core/view';
import { oa } from './../jsonld/ns';
import Node from './../jsonld/node';
import Graph from './../jsonld/graph';

import { isType, getScrollTop } from './../utilities/utilities';
import { validateCompleteness, getPositionDetails, getLinkedItems, getCssClassName, getSelector } from '../utilities/annotation/annotation-utilities';
import { getAnonymousTextQuoteSelector } from './../utilities/annotation/annotation-creation-utilities';
import OverlappingHighlightsStrategy, { OverlappingHighlights } from './overlapping-highlights-strategy';
import HighlightableTextTemplate from './highlightable-text-template';
import HighlightView from './highlight-view';
import OverlappingHighlightsView from './overlapping-highlights-view';
import OverlapDetailsView from './overlap-details-view';
import { getRange, getPositionDetailsFromRange } from '../utilities/range-utilities';
import ItemGraph from '../utilities/item-graph';

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
    positionContainer: JQuery<HTMLElement>;
    collection: Graph;
    ontology: Graph;
    showHighlightsInitially: boolean;

    /**
     * Store the oa:Annotation that needs to be scrolled to
     */
    scrollToNode: Node;

    hVs: HighlightView[] = [];

    overlaps: OverlappingHighlightsView[] = [];

    /**
     * Store a reference to a OverlapDetailView
     */
    overlapDetailView: OverlapDetailsView;

    isEditable: boolean;

    isInDOM: boolean;
    DOMMutationObserver: MutationObserver;

    selectedHighlight: HighlightView;

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
        this.hideAll();
        this.$el.html(this.template({ text: this.text }));
        this.showAll();
        return this;
    }

    handleDOMMutation(isInDOM: boolean): this {
        if (isInDOM) this.onInsertedIntoDOM();
        else this.onRemovedFromDOM();
        return this;
    }

    onInsertedIntoDOM(): this {
        this.isInDOM = true;
        this.textWrapper = this.$('.textWrapper');
        this.positionContainer = this.$('.position-container');

        let self = this;
        if (this.text) {
            this.initHighlights();
            each(this.hVs, (hV, callback) => hV.ensurePositionDetails(callback), function (err) {
                self.initOverlaps();
                if (!self.showHighlightsInitially) {
                    self.hideAll();
                }
                else {
                    self.scroll(self.scrollToNode);
                }
            });
        }

        return this;
    }

    onRemovedFromDOM(): this {
        this.isInDOM = false;
        return this;
    }

    initOverlaps(): void {
        if (this.overlaps) {
            this.overlaps.forEach(overlap => overlap.remove());
            this.overlaps = [];
        }
        let overlapStrategy = new OverlappingHighlightsStrategy();
        let overlaps: OverlappingHighlights[] = overlapStrategy.getOverlaps(this.hVs);

        overlaps.forEach(overlap => {
            let ohv = new OverlappingHighlightsView({
                textWrapper: this.textWrapper,
                relativeParent: this.positionContainer,
                positionDetails: overlap.positionDetails,
                highlights: overlap.highlightViews
            });

            ohv.on('click', this.onOverlapClicked, this);
            this.overlaps.push(ohv);
            ohv.render().$el.prependTo(this.$('.position-container'));
        });
        this.trigger('overlapsLoaded');
    }

    initHighlights(): this {
        this.collection.each((node) => {
            if (isType(node, oa.Annotation)) {
                this.addHighlight(node);
            }
        });

        return this;
    }

    /**
     * Add a new highlight to the text based on an instance of oa:Annotation.
     * @param newItems All items created when composing a new oa:Annotation.
     */
    add(newItems: ItemGraph): this {
        if (!this.isEditable) return;
        this.collection.add(newItems.models);
        this.overlaps = [];
        this.initOverlaps();
        return this;
    }

    /**
     * Remove all highlights from the text.
     */
    removeAll(): this {
        if (!this.isEditable) return;

        this.collection.each((node) => {
            if (isType(node, oa.Annotation)) {
                this.deleteNode(node);
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

        this.overlaps.forEach((overlap) => {
            overlap.render().$el.prependTo(this.$('.position-container'));
        });

        return this;
    }

    /**
     * Hide all annotations.
     */
    hideAll(): this {
        this.hVs.forEach((hV) => {
            hV.$el.detach();
            hV.unSelect();
        });

        this.overlaps.forEach((overlap) => {
            overlap.$el.detach();
        });

        if (this.overlapDetailView) this.overlapDetailView.$el.detach();
        return this;
    }

    /**
     * Remove a single highlight.
     * @param annotation The instance of oa:Annotation to remove.
     */
    removeHighlight(annotation: Node) {
        this.deleteNode(annotation);
    }

    private deleteFromCollection(annotation: Node): boolean {
        if (!isType(annotation, oa.Annotation)) return false;
        this.collection.remove([annotation].concat(getLinkedItems(annotation)));
        return true;
    }

    /**
     * Add a HighlightView to the current text.
     * Note that this method appends the new HighlightView to the DOM (i.e. position container).
     * @param node The Node to base the highlight on.
     */
    private addHighlight(node: Node): HighlightView {
        if (!isType(node, oa.Annotation)) return;

        // Get styling here because HighlightViews shouldn't care about the ontology (nor should this view, but ok..)
        let cssClass = getCssClassName(node, this.ontology);

        let hV = new HighlightView({
            model: node,
            cssClass: cssClass,
            textWrapper: this.textWrapper,
            relativeParent: this.positionContainer,
            isDeletable: this.isEditable
        });

        this.bindEvents(hV);
        this.hVs.push(hV);
        hV.render().$el.prependTo(this.$('.position-container'));
        this.trigger('highlightAdded', node);
        return hV;
    }

    /**
     * Find highlightView associated with instance of oa:Annotation,
     * and decide where to center the view (i.e. long highlight at top,
     * vertically centered otherwise).
     */
    private scroll(scrollToNode: Node): this {
        if (!scrollToNode) return this;
        if (this.overlapDetailView) {
            this.onCloseOverlapDetail();
        }

        let scrollToHv = this.getHighlightView(scrollToNode);
        if (scrollToHv) {
            let scrollableEl = this.$el;
            let scrollTop = getScrollTop(scrollableEl, scrollToHv.getTop(), scrollToHv.getHeight());
            this.processSelection(scrollToHv, scrollToNode);
            scrollableEl.animate({ scrollTop: scrollTop }, 800);
        }
        return this;
    }

    private getHighlightView(annotation: Node): HighlightView {
        return this.hVs.find(hV => hV.model === annotation);
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

    deleteNode(node: Node): this {
        if (this.deleteFromCollection(node)) {
            this.hVs.find(hV => hV.model === node).remove();
            this.initOverlaps();
            this.trigger('delete', node);
        }
        return this;
    }

    bindEvents(hV: HighlightView): this {
        this.listenTo(hV, 'hover', this.onHover);
        this.listenTo(hV, 'hoverEnd', this.onHoverEnd);
        this.listenTo(hV, 'delete', this.deleteNode);
        this.listenTo(hV, 'click', this.onClicked);
        return this;
    }

    processSelection(hV: HighlightView, annotation: Node): this {
        let isNew = true;

        if (this.selectedHighlight) {
            isNew = this.selectedHighlight.cid !== hV.cid;
            this.unSelect(this.selectedHighlight, this.selectedHighlight.model);
            this.selectedHighlight = undefined;
        }

        if (isNew) {
            this.select(hV, annotation);
        }

        return this;
    }

    select(hV: HighlightView, annotation: Node): this {
        hV.select();
        this.selectedHighlight = hV;
        this.trigger('highlightSelected', annotation);
        return this;
    }

    unSelect(hV: HighlightView, annotation: Node): this {
        hV.unSelect();
        this.trigger('highlightUnselected', annotation);
        return this;
    }

    onOverlapClicked(hVs: HighlightView[], ovh: OverlappingHighlightsView): this {
        if (this.overlapDetailView) {
            this.onCloseOverlapDetail();
        }

        this.overlapDetailView = new OverlapDetailsView({
            highlightViews: hVs
        });
        let verticalMiddle = ovh.getVerticalMiddle() - this.positionContainer.offset().top;
        this.overlapDetailView.render().position(verticalMiddle, this.positionContainer.outerWidth()).$el.prependTo(this.positionContainer);
        this.overlapDetailView.on('detailClicked', this.onOverlapDetailClicked, this);
        this.overlapDetailView.on('closed', this.onCloseOverlapDetail, this);
        return this;
    }

    onOverlapDetailClicked(hV: HighlightView) {
        this.onClicked(hV, hV.model);
    }

    onCloseOverlapDetail(): this {
        this.overlapDetailView.$el.detach();
        if (this.selectedHighlight) {
            this.unSelect(this.selectedHighlight, this.selectedHighlight.model);
            this.selectedHighlight = undefined;
        }
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

    onTextSelected(): void {
        if (!this.isEditable) return;

        let selection = window.getSelection();
        let range = selection.getRangeAt(0).cloneRange();

        // Ignore empty selections
        if (range.startOffset === range.endOffset) return;

        this.trigger('textSelected', range, getPositionDetailsFromRange(this.textWrapper, range));
    }

    onClicked(hV: HighlightView, node: Node): this {
        this.processSelection(hV, node);
        return this;
    }

    /**
     * Handles scroll events and re-emits them
     * If applicable, this will include the 'oa:Selector` currently visible.
     */
    onScroll(): void {
        let scrollableEl = this.$el;
        let scrollableVisibleMiddle = scrollableEl.offset().top + (scrollableEl.height() / 2);
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

        let visibleHighlights = this.hVs.filter((hV) => {
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
        'mouseup': 'onTextSelected',
    }
});
