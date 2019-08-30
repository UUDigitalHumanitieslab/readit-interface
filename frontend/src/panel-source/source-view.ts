import { ViewOptions as BaseOpt } from 'backbone';
import { extend, isUndefined, isNull } from 'lodash';
import View from './../core/view';
import Model from './../core/model';

import Node from './../jsonld/node';
import Graph from './../jsonld/graph';
import sourceTemplate from './source-template';
import HighlightableTextView from '../utilities/highlight/highlightable-text-view';

import { schema, vocab } from './../jsonld/ns';
import { isType } from './../utilities/utilities';
import { isNullOrUndefined } from 'util';

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
        this.$el.html(this.template({ title: this.model.get(schema.name)[0] }));
        this.$('highlightable-text-view').replaceWith(this.htv.render().$el);

        if (this.showHighlightsInitially) {
            this.toggleHighlights();
        }

        return this;
    }

    bindToEvents(htv: HighlightableTextView): HighlightableTextView {
        this.htv.on('hover', this.onHover, this);
        this.htv.on('hoverEnd', this.onHoverEnd, this);
        this.htv.on('click', this.onClick, this);
        this.htv.on('scroll', this.onScroll, this);
        return htv;
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
    onClick(node: Node): void {
        this.trigger('click', node);
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
        }
        else {
            this.showHighlights();
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
        this.trigger('showAnnotations', this.collection);
        return this;
    }

    hideHighlights(): this {
        this.htv.hideAll();
        return this;
    }

    toggleMetadata(): this {
        if (this.isShowingMetadata) {
            this.trigger('hideMetadata', this.model);
        } else {
            this.trigger('showMetadata', this.model);
        }
        this.toggleToolbarItemSelected('metadata');
        return this;
    }

    toggleViewMode(): this {
        // TODO: update when full screen modal is implemented
        if (this.isInFullScreenViewMode) this.trigger('shrink', this);
        else this.trigger('enlarge', this);
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
