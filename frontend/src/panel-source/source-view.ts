import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from './../core/view';
import Model from './../core/model';

import Node from './../jsonld/node';
import Graph from './../jsonld/graph';
import sourceTemplate from './source-template';
import HighlightableTextView from '../highlight/highlightable-text-view';

import { schema, vocab } from './../jsonld/ns';
import { isType } from './../utilities/utilities';
import HighlightView from '../highlight/highlight-view';
import ItemGraph from '../utilities/item-graph';
import { AnnotationPositionDetails } from '../utilities/annotation/annotation-utilities';

export interface ViewOptions extends BaseOpt<Model> {
    /**
     * An instance of vocab('Source).
     */
    model: Node;

    /**
     * The collection of oa:Annotations (and the items representing their details) associated with the source.
     */
    collection: Graph;

    /**
     * Specify whether the View should only display oa:Annotations, or if it allows editing
     * them. Defaults to false.
     */
    isEditable?: boolean;

    /**
     * Specify whether highlights should be displayed when the view becomes visible.
     * Defaults to false.
     */
    showHighlightsInitially?: boolean;

    /**
     * Optional. An oa:Annotation instance, present in the items Graph, that
     * will be scrolled to once the view is visible.
     */
    initialScrollTo?: Node;
}

export default class SourceView extends View<Node> {
    collection: Graph;
    isEditable: boolean;
    showHighlightsInitially: boolean;
    initialScrollTo?: Node;

    /**
     * Store reference to the instance of HighlightableTextView utilized by this view.
     */
    htv: HighlightableTextView;

    /**
     * Keep track of visiblility of the highlights;
     */
    isShowingHighlights: boolean;

    /**
     * Keep track of visiblility of the metadata;
     */
    isShowingMetadata: boolean;

    /**
     * Keep track of visiblility of the view mode.
     */
    isInFullScreenViewMode: boolean;

    constructor(options?: ViewOptions) {
        super(options);
        this.validate();

        this.initialScrollTo = options.initialScrollTo;
        this.isEditable = options.isEditable || false;
        this.showHighlightsInitially = options.showHighlightsInitially || this.initialScrollTo != null || false;
        this.isShowingHighlights = this.showHighlightsInitially;

        this.htv = new HighlightableTextView({
            text: <string>this.model.get(schema.text)[0],
            showHighlightsInitially: this.showHighlightsInitially,
            collection: this.collection,
            initialScrollTo: this.initialScrollTo,
            isEditable: this.isEditable
        });
        this.bindToEvents(this.htv);
    }

    validate() {
        if (this.model == undefined) {
            throw RangeError("model cannot be undefined");
        }
        if (!isType(this.model, vocab('Source'))) {
            throw new TypeError("model should be of type vocab('Source')");
        }
    }

    render(): this {
        this.htv.$el.detach();
        this.$el.html(this.template({ title: this.model.get(schema('name'))[0] }));

        this.$('highlightable-text-view').replaceWith(this.htv.render().$el);

        if (this.showHighlightsInitially) {
            this.trigger('sourceview:showAnnotations', this);
            this.toggleToolbarItemSelected('annotations');
        }

        return this;
    }

    bindToEvents(htv: HighlightableTextView): HighlightableTextView {
        this.htv.on('hover', this.onHover, this);
        this.htv.on('hoverEnd', this.onHoverEnd, this);
        this.htv.on('highlightClicked', this.onHighlightClicked, this);
        this.htv.on('highlightSelected', this.onHighlightSelected, this);
        this.htv.on('highlightUnselected', this.onHighlightUnselected, this);
        this.htv.on('highlightDeleted', this.onHighlightDeleted, this);
        this.htv.on('textSelected', this.onTextSelected, this);
        this.htv.on('scroll', this.onScroll, this);
        return htv;
    }

    add(newItems: ItemGraph): this {
        this.htv.addAnnotation(newItems);
        return this;
    }

    /**
     * Pass request to HighlightableTextView
     */
    processClick(annotation: Node): this {
        this.htv.processClick(annotation);
        return this;
    }

    processNoInitialHighlights(): this {
        this.htv.processNoInitialHighlights();
        this.trigger('sourceView:noInitialHighlights', this);
        return this;
    }

    /**
     * Pass events from HighlightableTextView
     */
    onHover(node: Node): void {
        this.trigger('hover', node);
    }

    /**
     * Pass events from HighlightableTextView
     */
    onHoverEnd(node: Node): void {
        this.trigger('hoverEnd', node);
    }

    /**
     * Pass events from HighlightableTextView
     */
    onTextSelected(range: Range, posDetails: AnnotationPositionDetails): void {
        this.trigger('sourceview:textSelected', this, this.model, range, posDetails);
    }

    /**
     * Pass events from HighlightableTextView
     */
    onHighlightClicked(node: Node): void {
        this.trigger('sourceview:highlightClicked', this, node);
    }

    /**
     * Pass events from HighlightableTextView
     */
    onHighlightSelected(node: Node): void {
        this.trigger('sourceview:highlightSelected', this, node);
    }

    /**
     * Pass events from HighlightableTextView
     */
    onHighlightUnselected(node: Node): void {
        this.trigger('sourceview:highlightUnselected', this, node);
    }

    /**
     * Pass events from HighlightableTextView
     */
    onHighlightDeleted(node: Node): void {
        this.trigger('sourceview:highlightDeleted', this, node);
    }

    /**
     * Pass events from HighlightableTextView
     */
    onScroll(selector?: Node): void {
        this.trigger('scroll', selector);
    }

    /**
     * Toggle highlights on and off.
     */
    toggleHighlights(): this {
        if (this.isShowingHighlights) {
            this.hideHighlights();
            this.trigger('sourceview:hideAnnotations', this);
        }
        else {
            this.showHighlights();
            this.trigger('sourceview:showAnnotations', this, true);
        }
        this.toggleToolbarItemSelected('annotations');
        this.isShowingHighlights = !this.isShowingHighlights;
        return this;
    }

    toggleToolbarItemSelected(name: string): this {
        this.$(`.toolbar-${name}`).toggleClass("is-active");
        return this;
    }

    showHighlights(): this {
        this.htv.showAll();
        return this;
    }

    hideHighlights(): this {
        this.htv.hideAll();
        return this;
    }

    toggleMetadata(): this {
        if (this.isShowingMetadata) {
            this.trigger('sourceview:hideMetadata', this, this.model);
        } else {
            this.trigger('sourceview:showMetadata', this, this.model);
        }
        this.isShowingMetadata = !this.isShowingMetadata;
        this.toggleToolbarItemSelected('metadata');

        return this;
    }

    toggleViewMode(): this {
        // TODO: update when full screen modal is implemented
        if (this.isInFullScreenViewMode) this.trigger('sourceView:shrink', this);
        else this.trigger('sourceView:enlarge', this);
        this.isInFullScreenViewMode = !this.isInFullScreenViewMode;
        this.toggleToolbarItemSelected('viewmode');
        return this;
    }

    scrollTo(annotation: Node): void {
        this.htv.scrollTo(annotation);
    }
}
extend(SourceView.prototype, {
    tagName: 'div',
    className: 'source explorer-panel',
    template: sourceTemplate,
    events: {
        'click .toolbar-metadata': 'toggleMetadata',
        'click .toolbar-annotations': 'toggleHighlights',
        'click .toolbar-viewmode': 'toggleViewMode',
    }
});
