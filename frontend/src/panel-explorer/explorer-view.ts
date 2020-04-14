import { ViewOptions as BaseOpt } from 'backbone';
import {
    extend,
    bind,
    debounce,
    isFunction,
    sortedIndexBy,
    constant,
} from 'lodash';
import Model from '../core/model';
import View from '../core/view';

import Graph from '../jsonld/graph';
import PanelStackView from './explorer-panelstack-view';
import EventController from './explorer-event-controller';
import { animatedScroll, ScrollType } from './../utilities/scrolling-utilities';
import fastTimeout from '../utilities/fastTimeout';

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
    rltPanelStack: { [cid: string]: number };

    /**
     * Keep track of currently fully visible stack (for scroll event purposes)
     */
    mostRightFullyVisibleStack: PanelStackView;

    constructor(options?: ViewOptions) {
        super(options);
        if (!options.ontology) throw new TypeError('ontology cannot be null or undefined');

        this.ontology = options.ontology;
        this.stacks = [];
        this.eventController = new EventController(this);
        this.rltPanelStack = {};
        this.push(options.first);

        this.$el.on('scroll', debounce(bind(this.onScroll, this), 500));
    }

    render(): View {
        for (let panelStack of this.stacks) {
            panelStack.render().$el.appendTo(this.$el);
        }

        this.scroll();

        return this;
    }

    /**
     * Animated scroll to put a stack in focus (i.e. at the right of the screen).
     * By default scrolls to the rightmost stack.
     * @param stack: Optional. The stack to focus on / scroll to.
     */
    scroll(stack?: PanelStackView, callback?: any): this {
        if (!stack) stack = this.getRightMostStack();
        let scrollTarget = stack.getRightBorderOffset() - $(window).width();
        animatedScroll(ScrollType.Left, this.$el, scrollTarget, callback);
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
        this.rltPanelStack[panel.cid] = position;
        stack.render().$el.appendTo(this.$el);
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
            position = this.rltPanelStack[ontoPanel.cid];

            // validate that the ontoPanel is on top of its stack
            let stackTop = this.stacks[position].getTopPanel();
            if (ontoPanel !== stackTop) {
                throw new RangeError(`ontoPanel with cid '${ontoPanel.cid}' is not a topmost panel`);
            }
        } else {
            ontoPanel = this.getRightMostStack().getTopPanel();
        }

        let stack = this.stacks[position];
        // remove the old panel for this stack from search container, new one may have different width
        stack.push(panel);
        this.rltPanelStack[panel.cid] = position;

        this.eventController.subscribeToPanelEvents(panel);
        this.trigger('overlay', panel, ontoPanel, position, (position - this.stacks.length));
        this.scroll(stack);
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
        let stack = this.stacks[position];
        let scrollToStack = stack;
        if (stack.hasOnlyOnePanel()) scrollToStack = this.stacks[position - 1];
        let poppedPanel = this.getRightMostStack().getTopPanel();
        delete this.rltPanelStack[poppedPanel.cid];

        const deleteAndTrigger = () => {
            this.deletePanel(position);
            this.trigger('pop', poppedPanel, position);
        };
        if (stack.getLeftBorderOffset() < this.getMostRight() && this.$el.scrollLeft() > 0) {
            this.scroll(scrollToStack, deleteAndTrigger);
        }
        else fastTimeout(deleteAndTrigger);
        return poppedPanel;
    }

    popAsync(): Promise<View> {
        return new Promise(resolve => {
            const poppedPanel = this.pop();
            if (poppedPanel) {
                this.once('pop', resolve);
            } else {
                resolve(poppedPanel);
            }
        });
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
        let position = this.rltPanelStack[panel.cid];
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
     * Pop (async, because of scrolling) until `popUntilPanel` is the rightmost panel.
     * When the scroll is done, push `newPanel`.
     * @param popUntilPanel Pop until this panel is the rightmost panel
     * @param newPanel Either a panel or a function that returns a panel. If the latter,
     * the function will be called after all the `pop`s are completed.
     */
    popUntilAndPush(popUntilPanel: View, newPanel: View | (() => View)) : this {
        this.popUntilAsync(popUntilPanel).then(() => {
            if (isFunction(newPanel)) newPanel = (newPanel as () => View)();
            this.push(newPanel as View);
        });
        return this;
    }

    /**
    * Returns `this` immediately, but the actual `pop`s are performed async. If
    * you need to do anything AFTER the last pop, listen once for the
    * `pop:until` event or use `popUntilAsync` instead.
    * @param panel The panel that needs to become rightmost.
    */
    popUntil(panel: View): this {
        this.popUntilAsync(panel);
        return this;
    }

    async popUntilAsync(panel: View): Promise<this> {
        let i = 0;
        while (this.getRightMostStack().getTopPanel().cid !== panel.cid && i < 1000) {
            await this.popAsync();
            i++;
        }
        if (i === 999) {
            // Note that this check exists only to protect developers.
            // If one consumes `popUntil` without being aware it will async,
            // `panel` might be replaced while the popping is not completed yet,
            // resulting inan infinite loop.
            throw new RangeError('Cannot find panel to pop until. Do you need to async?');
        }
        this.trigger('pop:until', panel);
        return this;
    }

    /**
     * Remove the topmost panel from the stack at position. Returns the deleted panel.
     * @param position The indes of the stack to remove the panel from
     */
    deletePanel(position: number): View {
        let stack = this.stacks[position];
        let panel = stack.getTopPanel();
        stack.pop();

        if (stack.panels.length == 0) {
            this.stacks.splice(position, 1);
        }

        delete this.rltPanelStack[panel.cid];

        return panel;
    }

    /**
     * Get the rightmost stack.
     */
    getRightMostStack(): PanelStackView {
        return this.stacks[this.stacks.length - 1];
    }

    /**
     * Get a value to index stacks on.
     * This is a helper function for binary searching.
     */
    getStackIndexvalue(view: PanelStackView): number {
        return view.getRightBorderOffset();
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
            let position = this.rltPanelStack[topPanel.cid];
            this.trigger('scrollTo', topPanel, position, (position - this.stacks.length));
        }
    }

    /**
     * Get a number that represents the most right visible pixel(s)
     * of the explorer. Ideal for evaluating if a panel / stack is visible.
     */
    getMostRight(): number {
        return this.$el.scrollLeft() + this.$el.innerWidth();
    }

    getMostRightFullyVisibleStack(): PanelStackView {
        const prop = {
            getRightBorderOffset: constant(this.getMostRight()),
        } as PanelStackView;
        const index = sortedIndexBy(this.stacks, prop, this.getStackIndexvalue.bind(this));
        return this.stacks[Math.max(0, index - 1)];
    }
}
extend(ExplorerView.prototype, {
    tagName: 'div',
    className: 'explorer',
    events: {
    }
});
