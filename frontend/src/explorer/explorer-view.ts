import { ViewOptions as BaseOpt } from 'backbone';
import {
    extend,
    bind,
    debounce,
    isFunction,
    sortedIndexBy,
    constant,
    isString,
} from 'lodash';
import Model from '../core/model';
import View from '../core/view';

import PanelStackView from './explorer-panelstack-view';
import { animatedScroll, ScrollType } from './../utilities/scrolling-utilities';
import fastTimeout from '../core/fastTimeout';

const scrollFudge = 100;

export interface ViewOptions extends BaseOpt<Model> {
    // TODO: do we need a PanelBaseView?
    first: View;
}

export default class ExplorerView extends View {
    stacks: PanelStackView[];

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
        this.stacks = [];
        this.rltPanelStack = {};
        this.scroll = debounce(this.scroll, 100);
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

    has(cid: string): boolean {
        return cid in this.rltPanelStack;
    }

    /**
     * Animated scroll to make a stack visible.
     * If the stack is not already visible, apply minimal horizontal scroll so
     * that the stack is just within the viewport. Otherwise, no animation
     * occurs.
     * By default scrolls to the rightmost stack.
     * @param stack: Optional. The stack, or the cid of a panel, to
     * focus on / scroll to.
     */
    scroll(stack?: string | PanelStackView, callback?: any): this {
        if (isString(stack)) stack = this.stacks[this.rltPanelStack[stack]];
        if (!stack) stack = this.getRightMostStack();
        stack.getTopPanel().trigger('announceRoute');
        const thisLeft = this.$el.scrollLeft();
        const thisRight = this.getMostRight();
        const stackLeft = stack.getLeftBorderOffset();
        const stackRight = stackLeft + stack.getWidth();
        let scrollTarget;
        if (stackRight - thisLeft < scrollFudge ||
            thisRight - stackLeft < scrollFudge
        ) {
            scrollTarget = stackRight - $(window).width();
        } else {
            if (callback) fastTimeout(callback);
            return this;
        }
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
        let position = this.stacks.length;
        this.stacks.push(new PanelStackView({ first: panel }));
        let stack = this.stacks[position];
        this.rltPanelStack[panel.cid] = position;
        stack.render().$el.appendTo(this.$el);
        panel.activate();
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
        panel.activate();
        this.rltPanelStack[panel.cid] = position;

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

        this.scroll(scrollToStack);
        this.deletePanel(position);
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
        let position = this.rltPanelStack[panel.cid];
        const stack = this.stacks[position];
        let stackTop = stack.getTopPanel();
        if (panel.cid !== stackTop.cid) {
            throw new RangeError(`panel with cid '${panel.cid}' is not a topmost panel`);
        }
        if (stack.hasOnlyOnePanel()) {
            throw new RangeError(`cannot remove panel with cid '${panel.cid}' because it is a bottom panel (not an overlay)`);
        }

        let removedPanel = this.deletePanel(position);
        this.scroll(stack);
        this.trigger('removeOverlay', removedPanel, stack.getTopPanel(), position, (position - this.stacks.length));
        return removedPanel;
    }

    /**
    * Repeatedly call `this.pop()` until `panel` is the rightmost panel.
    * @param panel The panel that needs to become rightmost.
    */
    popUntil(panel: View): this {
        if (this.rltPanelStack[panel.cid] == null) {
            throw new RangeError('Cannot find panel to pop until.');
        }
        while (this.getRightMostStack().getTopPanel().cid !== panel.cid) {
            this.pop();
        }
        this.trigger('pop:until', panel);
        return this;
    }

    /**
    * Remove all panels, then make `panel` the new first panel.
    * @param panel The panel that needs to become leftmost.
    */
    reset(panel: View): this {
        while (this.stacks.length) this.pop();
        this.trigger('reset', this).push(panel);
        return this;
    }

    /**
     * Scroll to a panel if present, otherwise execute an action of choice.
     * Useful in routing.
     */
    scrollOrAction(cid, action: () => void): this {
        if (isString(cid) && this.has(cid)) {
            this.scroll(cid);
        } else {
            action();
        }
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
    setHeight(height: number): this {
        this.$el.css('height', height);
        return this;
    }

    onScroll(): void {
        let mostRightFullyVisibleStack = this.getMostRightFullyVisibleStack();

        if (mostRightFullyVisibleStack !== this.mostRightFullyVisibleStack) {
            this.mostRightFullyVisibleStack = mostRightFullyVisibleStack;
            let topPanel = mostRightFullyVisibleStack.getTopPanel();
            let position = this.rltPanelStack[topPanel.cid];
            this.trigger('scrollTo', topPanel, position, (position - this.stacks.length));
            topPanel.trigger('announceRoute');
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
