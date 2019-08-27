import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from './../core/view';
import Model from './../core/model';

import Node from './../jsonld/node';
import Graph from './../jsonld/graph';
import sourceTemplate from './source-template';
import HighlightableTextView from '../utilities/highlight/highlightable-text-view';


export interface ViewOptions extends BaseOpt<Model> {
    /**
     * The HTML string that represents the source.
     * TODO: update when we know what Source will look like
     */
    sourceHTML: string;

    /**
     * At least a Source, and potentially its associated oa:Annotations (and their details).
     */
    items: Graph

    /**
     * Specify whether to display the View in Full Viewport Mode.
     * Defaults to false, i.e. PanelMode
     */
    inFullViewportMode: boolean;

    /**
     * Specify whether the View should only display oa:Annotations, or if it allows editing
     * them. Defaults to false.
     */
    isEditable: boolean;

    /**
     * Specify whether highlights should be displayed when the view becomes visible.
     * Defaults to false.
     */
    showHighlightsInitially: boolean;

    /**
     * Optional. An oa:Annotation instance, present in the 'items' Graph, that
     * you want to scroll to once the view is visible.
     */
    initialScrollTo?: Node;
}

export default class SourceView extends View {
    items: Graph;
    sourceHTML: string;
    inFullViewportMode: boolean;
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

    constructor(options?: ViewOptions) {
        super(options);

        // TODO: validate if a source is in the Graph
        // (once we know what sources will look like)

        this.items = options.items;
        this.initialScrollTo = options.initialScrollTo;
        this.sourceHTML = options.sourceHTML;
        this.isEditable = options.isEditable;
        this.showHighlightsInitially = options.showHighlightsInitially;

        this.htv = new HighlightableTextView({
            text: this.sourceHTML,
            showHighlightsInitially: true,
            collection: this.items,
            initialScrollTo: this.initialScrollTo
        });
        this.bindToEvents(this.htv);

        this.inFullViewportMode = options.inFullViewportMode;

        // TODO: if panel mode
        this.$el.addClass('explorer-panel');
    }

    render(): this {
        this.$el.html(this.template(this));
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
        this.trigger('showAnnotations', this.items);
        return this;
    }

    hideHighlights(): this {
        this.htv.hideAll();
        return this;
    }

    toggleMetadata(): this {
        // TODO: add Source to event payload when we know what it looks like
        if (this.isShowingMetadata) {
            this.trigger('hideMetadata');
        } else {
            this.trigger('showMetadata');
        }
        this.toggleToolbarItemSelected('metadata');
        return this;
    }

    toggleViewMode(): this {
        if (this.inFullViewportMode) this.trigger('shrink', this);
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
    className: 'source',
    template: sourceTemplate,
    events: {
        'click .toolbar-metadata': 'toggleMetadata',
        'click .toolbar-annotations': 'toggleHighlights',
        'click .toolbar-viewmode': 'toggleViewMode',
    }
});
