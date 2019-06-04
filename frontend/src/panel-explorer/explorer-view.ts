import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import Model from '../core/model';
import View from '../core/view';

import PanelStackView from './explorer-panelstack-view';

import SourceView from '../panel-source/source-view';
import LdItemView from '../panel-ld-item/ld-item-view';

import Node from '../jsonld/node';
import { JsonLdObject } from '../jsonld/json';

export interface ViewOptions extends BaseOpt<Model> {
    // TODO: do we need a PanelBaseView?
    first: View;
}

export default class ExplorerView extends View {
    panelStacks: PanelStackView[];

    constructor(options?: ViewOptions) {
        super(options);
        this.panelStacks = [];
        this.push(options.first);
    }

    render(): View {
        this.setHeight();

        for (let panelStack of this.panelStacks) {
            panelStack.render().$el.appendTo(this.$el);
        }

        this.scroll();

        return this;
    }

    /**
     * Animated scroll to the outer right of the explorer.
     */
    scroll(): void {
        let totalWidth = 0;

        for (let stack of this.panelStacks) {
            totalWidth += stack.getWidth();
        }

        this.$el.animate({scrollLeft: totalWidth}, 800);
    }

    /**
     * Add a panel at the rightmost end of the explorer (i.e. as first of a new stack).
     * @param panel The View to push
     */
    push(panel: View): void {
        let position = this.panelStacks.length == 0 ? 0 : this.panelStacks.length;
        this.panelStacks[position] = new PanelStackView({ first: panel });
        this.subscribeToPanelEvents(panel);
        this.panelStacks[position].render().$el.appendTo(this.$el);
        this.trigger('push', panel, position);
        this.scroll();
    }

    /**
     * Remove the rightmost panel
     */
    pop(): View {
        if (this.panelStacks.length == 0) return;

        let position = this.panelStacks.length;
        let stack = this.panelStacks[position];
        let poppedPanel = stack.getTopPanel();
        poppedPanel.off();
        stack.pop();
        this.trigger('pop', poppedPanel, position);
        return poppedPanel;
    }

    /**
     * Dynamically set the height for the explorer, based on the window's height.
     */
    setHeight(): void {
        let vh = $(window).height();
        // where 242 compensates for menu and footer and 555 is min-height
        let height = vh - 242 > 555 ? vh - 242 : 555;
        this.$el.css('height', height);
    }

    subscribeToPanelEvents(panel: View): void {
        panel.on({
            'fakeBtnClicked': this.ldItemViewFakeButtonClicked,
            'toolbarClicked': this.sourceViewToolbarClicked,
        }, this);
    }

    sourceViewToolbarClicked(buttonClicked: string): void {
        let ldiView = new LdItemView({ model: this.getMockNode() });
        this.push(ldiView);
    }

    ldItemViewFakeButtonClicked() {
        let sourceView = new SourceView();
        this.push(sourceView);
    }



    getMockNode(): Node {
        let attributes: JsonLdObject = {
            '@id': 'uniqueID',
            'skos:prefLabel': [
                { '@value': 'Content' },
            ],
            "@type": [
                { '@id': "rdfs:Class" }
            ],
            "owl:sameAs": [
                { '@id': "http://www.wikidata.org/entity/Q331656" }
            ],
            "creator": [
                { '@id': "staff:JdeKruif" },
            ],
            "created": [
                { '@value': "2085-12-31T04:33:16+0100" }
            ],
            "readit:Title": [
                { '@value': 'Pretty Little Title' }
            ],
            'skos:definition': [
                { '@value': 'Dit is de definitie van content' },
            ]
        }
        return new Node(attributes);
    }
}
extend(ExplorerView.prototype, {
    tagName: 'div',
    className: 'explorer',
    events: {
    }
});
