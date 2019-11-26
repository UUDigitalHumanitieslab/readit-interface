import { ViewOptions as BaseOpt } from 'backbone';
import { extend, sumBy, method, bind, debounce, findLast } from 'lodash';
import Model from '../core/model';
import View from '../core/view';

import Graph from '../jsonld/graph';
import PanelStackView from './explorer-panelstack-view';
import EventController from './explorer-event-controller';
import LoadingSpinnerView from '../utilities/loading-spinner/loading-spinner-view';
import { BinarySearchStrategy } from './../utilities/binary-searchable-strategy/binary-search-strategy';

export interface ViewOptions extends BaseOpt<Model> {
    // TODO: do we need a PanelBaseView?
    first: View;
    ontology: Graph;
}

export default class ExplorerView extends View {
    ontology: Graph;
    stacks: PanelStackView[];

    eventController: EventController;

    /**
     * A reverse lookuptable containing each panel's cid as key,
     * and the position of the stack as the value. Perfect for finding
     * the stack that a panel is in/on.
     */
    rltPanelStack: Map<string, number>;

    /**
     * Keep track of currently fully visible stack (for scroll event purposes)
     */
    mostRightFullyVisibleStack: PanelStackView;

    /**
     * Have a loader ready to show when loading panels takes long.
     */
    loadingSpinnerView: LoadingSpinnerView;

    /**
     *
     */
    searchStrategy: BinarySearchStrategy;

    constructor(options?: ViewOptions) {
        super(options);
        if (!options.ontology) throw new TypeError('ontology cannot be null or undefined');

        this.ontology = options.ontology;
        this.stacks = [];
        this.eventController = new EventController(this);
        this.rltPanelStack = new Map();
        this.searchStrategy = new BinarySearchStrategy();
        this.push(options.first);

        this.$el.on('scroll', debounce(bind(this.onScroll, this), 500));

        this.loadingSpinnerView = new LoadingSpinnerView();
        this.loadingSpinnerView.render().$el.appendTo(this.$el);
    }

    render(): View {
        for (let panelStack of this.stacks) {
            panelStack.render().$el.appendTo(this.$el);
        }

        this.scroll();

        return this;
    }

    /**
     * Animated scroll to the outer right of the explorer.
     */
    scroll(): this {
        let totalWidth = sumBy(this.stacks, method('getWidth'));
        this.$el.animate({ scrollLeft: totalWidth }, 800);
        return this;
    }

    /**
     * Add a panel at the rightmost end of the explorer (i.e. as first of a new stack).
     * @param panel The panel to add.
     * @event push (panel,fromLeft) where 'panel' is the added panel, and 'fromLeft' the zero-indexed position
     * of the new panel's stack from the left.
     */
    push(panel: View): this {
        this.eventController.subscribeToPanelEvents(panel);
        let position = this.stacks.length;
        this.stacks.push(new PanelStackView({ first: panel }));
        let stack = this.stacks[position];
        this.rltPanelStack.set(panel.cid, position);
        stack.render().$el.appendTo(this.$el);
        this.searchStrategy.add({ indexValue: stack.getRightBorderOffset(), view: stack });
        this.trigger('push', panel, position);
        this.scroll();
        return this;
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
    overlay(panel: View, ontoPanel?: View): this {
        let position = this.stacks.length - 1;

        if (ontoPanel) {
            position = this.rltPanelStack.get(ontoPanel.cid);

            // validate that the ontoPanel is on top of its stack
            let stackTop = this.stacks[position].getTopPanel();
            if (ontoPanel !== stackTop) {
                throw new RangeError(`ontoPanel with cid '${ontoPanel.cid}' is not a topmost panel`);
            }
        } else {
            ontoPanel = this.getRightMostStack().getTopPanel();
        }

        let stack = this.stacks[position];
        // remove the old panel for this stack from searchstrategy, new one may have different width
        this.searchStrategy.remove({ indexValue: stack.getRightBorderOffset(), view: stack });
        stack.push(panel);
        this.rltPanelStack.set(panel.cid, position);
        this.searchStrategy.add({ indexValue: stack.getRightBorderOffset(), view: stack });

        this.eventController.subscribeToPanelEvents(panel);
        this.trigger('overlay', panel, ontoPanel, position, (position - this.stacks.length));
        this.scroll();
        return this;
    }

    /**
     * Remove the rightmost panel.
     * @event pop (panel, fromLeft) where 'panel' is the removed panel and 'fromLeft' the zero-indexed position
     * of the stack panel used to be on.
     */
    pop(): View {
        if (this.stacks.length == 0) return;
        let position = this.stacks.length - 1;
        let poppedPanel = this.deletePanel(position);
        this.trigger('pop', poppedPanel, position);
        return poppedPanel;
    }

    /**
     * Remove a panel from any stack.
     * @param panel The panel to remove. Must be a topmost panel.
     * @event removeOverlay (panel, ontoPanel, fromLeft, fromRight) where 'panel' is the removed panel,
     * 'ontoPanel' is the new topmost panel in the stack, 'fromLeft' is the zero-indexed position of the stack
     * the panel was removed from the left, and 'fromRight' equals fromLeft minus the total number of stacks
     * (i.e. always negative and -1 for the rightmost panel).
     */
    removeOverlay(panel: View): View {
        // validate that the panel is on top of its stack
        let position = this.rltPanelStack.get(panel.cid);
        let stackTop = this.stacks[position].getTopPanel();
        if (panel.cid !== stackTop.cid) {
            throw new RangeError(`panel with cid '${panel.cid}' is not a topmost panel`);
        }
        if (this.stacks[position].hasOnlyOnePanel()) {
            throw new RangeError(`cannot remove panel with cid '${panel.cid}' because it is a bottom panel (not an overlay)`);
        }

        let removedPanel = this.deletePanel(position);
        this.trigger('removeOverlay', removedPanel, this.stacks[position].getTopPanel(), position, (position - this.stacks.length));
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

    /**
     * Remove the topmost panel from the stack at position. Returns the deleted panel.
     * @param position The indes of the stack to remove the panel from
     */
    deletePanel(position: number): View {
        let stack = this.stacks[position];
        this.searchStrategy.remove({ indexValue: stack.getRightBorderOffset(), view: stack });
        let panel = stack.getTopPanel();
        stack.pop();

        if (stack.panels.length == 0) {
            this.stacks.splice(position, 1);
        }
        else {
            this.searchStrategy.add({ indexValue: stack.getRightBorderOffset(), view: stack });
        }

        this.rltPanelStack.delete(panel.cid);

        return panel;
    }

    /**
     * Get the rightmost stack.
     */
    getRightMostStack(): PanelStackView {
        return this.stacks[this.stacks.length - 1];
    }

    /**
     * Dynamically set the height for the explorer, based on the viewport height.
     */
    setHeight(height: number): void {
        this.$el.css('height', height);
    }

    onScroll(): void {
        let mostRightFullyVisibleStack = this.getMostRightFullyVisibleStack();

        if (mostRightFullyVisibleStack !== this.mostRightFullyVisibleStack) {
            this.mostRightFullyVisibleStack = mostRightFullyVisibleStack;
            let topPanel = mostRightFullyVisibleStack.getTopPanel();
            let position = this.rltPanelStack.get(topPanel.cid);
            this.trigger('scrollTo', topPanel, position, (position - this.stacks.length));
        }
    }

    getMostRightFullyVisibleStack(): PanelStackView {
        let explorerMostRight = this.$el.scrollLeft() + this.$el.innerWidth();
        return this.searchStrategy.getClosestTo(explorerMostRight) as PanelStackView;
    }
}
extend(ExplorerView.prototype, {
    tagName: 'div',
    className: 'explorer',
    events: {
    }
});
