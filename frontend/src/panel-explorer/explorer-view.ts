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
     * @event push (panel,fromLeft) where 'panel' is the added panel, and 'fromLeft' the zero-indexed position
     * of the new panel's stack from the left.
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
     * Add a panel onto either the rightmost stack (i.e. this will not be a new stack),
     * or the panel provided. Will throw a RangeError if the ontoPanel is not a topmost panel.
     * @param panel The panel to add.
     * @param ontopanel Optional. The panel to add the provided panel on top of. Must be a topmost panel.
     * @event overlay (panel, ontoPanel, fromLeft, fromRight) where 'panel' is the added panel, 'ontoPanel'
     * is the panel where the added panel was added on top of, 'fromLeft' is the zero-indexed position
     * of the stack the panel was overlayed onto from the left, and 'fromRight' equals fromLeft minus the
     * total number of stacks (i.e. always negative and -1 for the rightmost panel).
     */
    overlay(panel: View, ontoPanel?: View) {
        let position = this.panelStacks.length - 1;

        if (ontoPanel) {
            position = this.rltPanelStack.get(ontoPanel.cid);

            // validate that the ontoPanel is on top of its stack
            let stackTop = this.panelStacks[position].getTopPanel();
            if (ontoPanel.cid !== stackTop.cid) {
                throw new RangeError(`ontoPanel with cid '${ontoPanel.cid}' is not a topmost panel`);
            }
        } else {
            ontoPanel = this.getRightMostStack();
        }

        let stack = this.panelStacks[position];
        stack.push(panel);
        this.rltPanelStack.set(panel.cid, position);
        this.subscribeToPanelEvents(panel);
        this.trigger('overlay', panel, ontoPanel, position, (position - this.panelStacks.length));
        this.scroll();
    }

    /**
     * Remove the rightmost stack.
     * @event pop (panel, fromLeft) where 'panel' is the removed panel and 'fromLeft' the zero-indexed position
     * of the stack panel used to be on.
     */
    pop(): View {
        if (this.panelStacks.length == 0) return;
        let position = this.panelStacks.length - 1;
        let poppedPanel = this.deletePanel(position);
        this.trigger('pop', poppedPanel, position);
        return poppedPanel;
    }

    /**
     * Remove a panel from any stack.
     * @param panel The panel to remove. Must be a topmost panel.
     * @event removeOverlay (panel, fromLeft, fromRight) where 'panel' is the removed panel, 'fromLeft' is
     * the zero-indexed position of the stack the panel was removed from the left, and 'fromRight'
     * equals fromLeft minus the total number of stacks (i.e. always negative and -1 for the rightmost panel).
     */
    removeOverlay(panel: View): View {
        // validate that the panel is on top of its stack
        let position = this.rltPanelStack.get(panel.cid);
        let stackTop = this.panelStacks[position].getTopPanel();
        if (panel.cid !== stackTop.cid) {
            throw new RangeError(`panel with cid '${panel.cid}' is not a topmost panel`);
        }

        let removedPanel = this.deletePanel(position);
        this.trigger('removeOverlay', removedPanel, position, (position - this.panelStacks.length));
        return removedPanel;
    }

    /**
     * Remove all panels and stacks until the desired panel is the rightmost panel in the explorer.
     * @param panel The panel that needs to become rightmost.
     */
    popUntil(panel: View): View {
        while (this.getRightMostStack().getTopPanel().cid !== panel.cid) {
            this.pop();
        }

        return this;
    }

    getRightMostStack(): PanelStackView {
        return this.panelStacks[this.panelStacks.length - 1];
    }

    deletePanel(position: number): View {
        let stack = this.panelStacks[position];
        let panel = stack.getTopPanel();
        panel.off();
        stack.pop();

        if (stack.panels.length == 0) {
            this.panelStacks.splice(position, 1);
        }

        this.rltPanelStack.delete(panel.cid);

        return panel;
    }

    /**
     * Dynamically set the height for the explorer, based on the viewport height.
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
