import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from './../core/view';
import Model from './../core/model';

import Node from './../jsonld/node';
import Graph from './../jsonld/graph';
import sourceTemplate from './source-template';
import HighlightableTextView from '../utilities/highlight/highlightable-text-view';

import mockSourceText from './../mock-data/mock-source-text';
import { oa } from '../jsonld/ns';

export interface ViewOptions extends BaseOpt<Model> {
    // TODO: receive Node instance of type Source
    annotations: Graph

    /**
     * Specify whether to display the View in Full Viewport Mode.
     * Defaults to false, i.e. PanelMode
     */
    inFullViewportMode: boolean;
}

export default class SourceView extends View {
    nodes: Graph;
    htv: HighlightableTextView;
    inFullViewportMode: boolean;

    isShowingAnnotations: boolean;
    tooltipAnnotations: string;

    constructor(options?: ViewOptions) {
        super(options);

        // TODO: validate ? (highlightableTV does it as well)

        if (options.annotations) {
            this.nodes = options.annotations;
        }

        let scrollTo = this.nodes.find(n => n.get("@id") == "https://read-it.hum.uu.nl/item/102");

        this.htv = new HighlightableTextView({
            text: mockSourceText,
            isEditable: true,
            showHighlightsInitially: true,
            collection: this.nodes,
            initialScrollTo: scrollTo
        });
        this.bindToEvents(this.htv);

        this.inFullViewportMode = options.inFullViewportMode;

        // TODO: if panel mode
        this.$el.addClass('explorer-panel');
    }

    render(): this {
        this.$el.html(this.template(this));


        // TODO: where does this come from?
        // let scrollTo = this.nodes.models.find(n => n.get('@id') === 'https://read-it.hum.uu.nl/item/102');


        this.$('highlightable-text-view').replaceWith(this.htv.render().$el);
        return this;
    }

    bindToEvents(htv: HighlightableTextView): HighlightableTextView {
        this.htv.on('scrollToReady', this.scroll, this);
        this.htv.on('hover', this.hover, this);
        this.htv.on('hoverEnd', this.hoverEnd, this);
        this.htv.on('click', this.click, this);
        return htv;
    }

    hover(node: Node) {
        this.trigger('hover', node);
    }

    hoverEnd(node: Node) {
        this.trigger('hoverEnd', node);
    }

    click(node: Node) {
        this.trigger('click', node);
    }

    toggleAnnotations(): this {
        if (this.isShowingAnnotations) {
            this.hideAnnotations();
        }
        else {
            this.showAnnotations();
        }
        this.$(".toolbar-annotations").toggleClass("is-active");
        this.isShowingAnnotations = !this.isShowingAnnotations;
        return this;
    }

    showAnnotations(): this {
        this.htv.showAll();
        this.trigger('showAnnotations', this.nodes);
        return this;
    }

    hideAnnotations(): this {
        this.htv.hideAll();
        return this;
    }

    showMetadata(): this {
        this.trigger('showMetadata', this.model);
        return this;
    }

    toggleViewMode(): this {
        if (this.inFullViewportMode) this.trigger('shrink', this);
        else this.trigger('enlarge', this);
        return this;
    }

    scrollTo(annotation: Node) {
        this.htv.scrollTo(annotation);
    }

    scroll(highlightTop: number, highlightHeight: number): this {
        let scrollableEl = this.$('.source-content');

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

        return this;
    }
}
extend(SourceView.prototype, {
    tagName: 'div',
    className: 'source',
    template: sourceTemplate,
    events: {
        'click .toolbar-metadata': 'showMetadata',
        'click .toolbar-annotations': 'toggleAnnotations',
        'click .toolbar-fullscreen': 'toggleViewMode',
    }
});
