import { extend } from 'lodash';
import { ViewOptions as BaseOpt } from 'backbone';

import View from './../core/view';
import Node from './../jsonld/node';


export interface ViewOptions extends BaseOpt<Node> {
    first: View;
}

export default class PanelStackView extends View {
    // TODO: do we need a PanelBaseView?
    panels: View[];

    constructor(options?: ViewOptions) {
        super(options);
        this.panels = [];
        this.push(options.first);
    }

    render(): this {
        return this;
    }

    pop(): View {
        let wasLastPanel = this.hasOnlyOnePanel();
        let poppedPanel = this.panels.pop().remove() as View;
        if (wasLastPanel) this.$el.remove();
        else this.getTopPanel().$el.appendTo(this.$el);
        return poppedPanel;
    }

    push(panel: View): this {
        if (this.panels.length > 0) {
            this.getTopPanel().$el.detach();
        }
        this.panels.push(panel);
        panel.render().$el.appendTo(this.$el);
        return this;
    }

    hasOnlyOnePanel(): boolean {
        return this.panels.length == 1;
    }

    getTopPanel(): View {
        return this.panels[this.panels.length - 1];
    }

    getWidth(): number {
        return this.$el.outerWidth();
    }

    /**
     * Get the offset for the outer edge of the right border of the stack.
     * Note that this visual boundary might be different from the actual left offset + outerWidth,
     * because of margins.
     */
    getRightBorderOffset(): number {
        let width = this.getWidth();
        let widthWithoutRightMargin = width - ((width - this.getTopPanel().$el.outerWidth()) / 2);
        return this.$el.parent().scrollLeft() + this.$el.position().left + widthWithoutRightMargin;
    }
}
extend(PanelStackView.prototype, {
    tagName: 'div',
    className: 'panel-stack',
    events: {
    }
});
