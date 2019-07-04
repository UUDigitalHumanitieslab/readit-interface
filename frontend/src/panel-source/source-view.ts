import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from './../core/view';
import Model from './../core/model';

import Graph from './../jsonld/graph';
import sourceTemplate from './source-template';
import HighlightableTextView from '../utilities/highlight/highlightable-text-view';

import mockSourceText from './../mock-data/mock-source-text';

export interface ViewOptions extends BaseOpt<Model> {
    annotations: Graph;

    /**
     * Specify whether to display the View in Full Viewport Mode.
     * Defaults to false.
     */
    inFullViewPortMode: boolean;
}

export default class SourceView extends View {
    annotations: Graph;
    htv: HighlightableTextView;
    inFullViewPortMode: boolean;

    constructor(options?: ViewOptions) {
        super(options);

        // TODO: validate ? (highlightableTV does it as well)

        if (options.annotations) {
            this.annotations = options.annotations;
        }

        this.inFullViewPortMode = options.inFullViewPortMode;

        // TODO: if panel mode
        this.$el.addClass('explorer-panel');
    }

    render(): this {
        this.$el.html(this.template(this));

        // TODO: where does this come from?
        // let scrollTo = this.annotations.models.find(n => n.get('@id') === 'https://read-it.hum.uu.nl/item/102')

        // TODO: when this is initialized earlier, the DOMInsertedIntoDocument event is not fired
        this.htv = new HighlightableTextView({
            text: mockSourceText,
            isEditable: true,
        });

        this.bindToEvents(this.htv);
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

    showAnnotations(): this {
        this.htv.add(this.annotations);
        this.trigger('showAnnotations', this.annotations);
        return this;
    }

    hideAnnotation(): this {
        this.htv.removeAll();
        return this;
    }

    showMetadata(): this {
        this.trigger('showMetadata', this.model);
        return this;
    }

    toggleViewMode(): this {
        if (this.inFullViewPortMode) this.trigger('shrink', this);
        else this.trigger('enlarge', this);
        return this;
    }

    // TODO: implement this one and the scroll() mentioned in specs
    scrollTo(annotation: Node) {

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
        'click .toolbar-annotations': 'showAnnotations',
        'click .toolbar-fullscreen': 'toggleViewMode',
    }
});
