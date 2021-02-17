import { extend } from 'lodash';
import View from '../core/view';

import template from './toolbar-template';

export default class SourceToolbarView extends View {

    initialize(): this {
        this.listenTo(this.model, 'change', this.toggleToolbarItemSelected)
        return this;
    }

    render(): this {
        this.$el.html(this.template(this));
        if (this.model.get('annotations')===true) {
            this.$(`.toolbar-annotations`).addClass("is-active");
        }
        return this
    }

    /**
     * Toggle highlights on and off.
     */
    toggleHighlights(): this {
        this.model.set('annotations', !this.model.get('annotations'));
        return this;
    }

    toggleMetadata(): this {
        this.model.set('metadata', !this.model.get('metadata'));
        return this;
    }

    toggleToolbarItemSelected(): this {
        const name = Object.keys(this.model.changed)[0];
        this.$(`.toolbar-${name}`).toggleClass("is-active");
        return this;
    }
}
extend(SourceToolbarView.prototype, {
    tagName: 'div',
    className: 'toolbar',
    template: template,
    events: {
        'click .toolbar-metadata': 'toggleMetadata',
        'click .toolbar-annotations': 'toggleHighlights',
    }
});
