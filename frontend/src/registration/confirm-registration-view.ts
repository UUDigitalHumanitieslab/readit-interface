import { extend } from 'lodash';
import View from '../core/view';

import LoadingSpinnerView from '../loading-spinner/loading-spinner-view';
import confirmRegistrationTemplate from './confirm-registration-template';

export default class ConfirmRegistrationView extends View {
    loadingSpinnerView: LoadingSpinnerView;
    awaitingConfirmation: boolean;
    isConfirmed: boolean;
    wasNotFound: boolean;
    hasError: boolean;

    initialize(): this {
        this.loadingSpinnerView = new LoadingSpinnerView();
        this.loadingSpinnerView.render();
        this.awaitingConfirmation = true;
        return this;
    }

    render(): this {
        this.loadingSpinnerView.remove();
        if (this.awaitingConfirmation) {
            this.loadingSpinnerView.$el.appendTo(this.$el);
            this.loadingSpinnerView.activate();
        }
        else {
            this.$el.html(this.template(this));
        }
        return this;
    }

    processKey(key: string): this {
        return this.trigger('confirm', key);
    }

    notFound(): this {
        this.awaitingConfirmation = false;
        this.wasNotFound = true;
        this.render();
        return this;
    }

    error(response: any): this {
        this.awaitingConfirmation = false;
        this.hasError = true;
        this.render();
        return this;
    }

    success(): this {
        this.awaitingConfirmation = false;
        this.isConfirmed = true;
        this.render();
        return this;
    }
}
extend(ConfirmRegistrationView.prototype, {
    tagName: 'section',
    className: 'modal is-active',
    template: confirmRegistrationTemplate
});

