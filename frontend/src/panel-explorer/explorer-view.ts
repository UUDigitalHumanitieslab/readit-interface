import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import Model from '../core/model';
import View from '../core/view';

import PanelStackView from './explorer-panelstack-view';

import SourceView from '../panel-source/source-view';
import LdItemView from '../panel-ld-item/ld-item-view';

import Node from '../jsonld/node';
import { JsonLdObject } from '../jsonld/json';
import internalLinkEnabler from '../core/internalLinks';

export interface ViewOptions extends BaseOpt<Model> {
    // TODO: do we need a PanelBaseView?
    first: View;
}

export default class ExplorerView extends View {
    panelStacks: PanelStackView[];

    /**
     * A reverse lookuptable containing each panel's cid as key,
     * and the position of the stack as the value. Perfect for finding
     * the stack that a panel is in/on.
     */
    rltPanelStack: Map<string, number>;

    constructor(options?: ViewOptions) {
        super(options);
        this.panelStacks = [];
        this.rltPanelStack = new Map();
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

        this.$el.animate({ scrollLeft: totalWidth }, 800);
    }

    /**
     * Add a panel at the rightmost end of the explorer (i.e. as first of a new stack).
     * @param panel The panel to add.
     */
    push(panel: View): void {
        let position = this.panelStacks.length;
        this.panelStacks[position] = new PanelStackView({ first: panel });
        this.rltPanelStack.set(panel.cid, position);
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
     * Add a panel onto either the rightmost stack (i.e. this will not be a new stack),
     * or the panel provided.
     * @param panel The panel to add.
     * @param ontopanel Optional. The panel to add the provided panel on top of.
     */
    overlay(panel: View, ontoPanel?: View) {
        let position = this.panelStacks.length - 1;

        if (ontoPanel) {
            position = this.rltPanelStack.get(ontoPanel.cid);

            // validate that the ontoPanel is on top of its stack
            let stackTop = this.panelStacks[position].getTopPanel();
            if (ontoPanel.cid !== stackTop.cid) {
                return; // TODO: do something instead of nothing? throw exception?
            }
        }

        let stack = this.panelStacks[position];
        stack.push(panel);
        this.rltPanelStack.set(panel.cid, position);
        this.subscribeToPanelEvents(panel);
        // this.trigger('overlay', panel, position);
        this.scroll();
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

        if (buttonClicked == 'metadata') {
            this.overlay(ldiView);
        } else if (buttonClicked == 'annotations') {
            let panel = this.panelStacks[1].getTopPanel();
            let sView = new SourceView();
            this.overlay(sView, panel);
        } else {
            this.push(ldiView);
        }
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
