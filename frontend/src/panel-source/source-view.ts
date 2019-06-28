import { ViewOptions as BaseOpt } from 'backbone';
import { extend, last } from 'lodash';
import View from './../core/view';
import Model from './../core/model';

import Node from './../jsonld/node';
import sourceTemplate from './source-template';
import HighlightableTextView from '../utilities/highlight/highlightable-text-view';

import mockSourceText from './../mock-data/mock-source-text';
import getMockAnnotationsGraph from './../mock-data/mock-annotations';

export interface ViewOptions extends BaseOpt<Model> {
    highlight: Node;
}

export default class SourceView extends View {
    highlight: Node;

    constructor(options?: ViewOptions) {
        super(options);

        // TODO validate

        if (options.highlight) {
            this.highlight = options.highlight;
        }
    }

    render(): this {
        this.$el.html(this.template(this));

        // TODO: if panel mode
        this.$el.addClass('explorer-panel');

        let graph = getMockAnnotationsGraph();

        let scrollTo = graph.models.find(n => n.get('@id') === 'https://read-it.hum.uu.nl/item/102')

        let htv = new HighlightableTextView({
            text: mockSourceText,
            collection: graph,
            isEditable: true,
            scrollTo: scrollTo,
        });

        htv.on('scrollToReady', this.scroll, this);

        this.$('highlightable-text-view').replaceWith(htv.render().$el);

        return this;
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

    onToolbarItemClicked(event: JQuery.TriggeredEvent) {
        let clickedItem = $(event.currentTarget).data('toolbar');
        this.trigger('toolbarClicked', clickedItem);
    }
}
extend(SourceView.prototype, {
    tagName: 'div',
    className: 'source',
    template: sourceTemplate,
    events: {
        'click .toolbar-item': 'onToolbarItemClicked',
    }
});
