import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from './../core/view';
import Model from './../core/model';

import sourceTemplate from './source-template';

import Node from './../jsonld/node';

import mockSourceText from './../mock-data/mock-source-text';
import HighlightableTextView from '../utilities/highlight/highlightable-text-view';
import Graph from '../jsonld/graph';

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

        let graph = new Graph([this.highlight]);

        let htv = new HighlightableTextView({
            text: mockSourceText,
            collection: graph,
            isEditable: true
        });


        this.$('highlightable-text-view').replaceWith(htv.render().$el);

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
