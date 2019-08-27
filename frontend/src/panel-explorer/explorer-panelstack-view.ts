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
        this.panels = [options.first];
    }

    render(): this {
        this.getTopPanel().render().$el.appendTo(this.$el);
        return this;
    }

    pop(): View {
        return this.panels.pop().remove() as View;
    }

    push(panel: View): this {
        this.getTopPanel().$el.detach();
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
}
extend(PanelStackView.prototype, {
    tagName: 'div',
    className: 'panel-stack',
    events: {
    }
});
