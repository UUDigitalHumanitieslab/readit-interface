import { ViewOptions } from 'backbone';
import { extend } from 'lodash';
import View from '../../core/view';

import loadingSpinnerTemplate from './loading-spinner-template';

export default class LoadingSpinnerView extends View {

    constructor(options?: ViewOptions) {
        super(options);
    }

    activate(): this {
        this.$el.addClass("is-active");
        return this;
    }

    deActivate(): this {
        this.$el.removeClass("is-active");
        return this;
    }

    render(): this {
        this.$el.append('<div class="loader"></div>');
        return this;
    }
}
extend(LoadingSpinnerView.prototype, {
    tagName: 'div',
    className: 'loading-spinner',
    template: loadingSpinnerTemplate
});
