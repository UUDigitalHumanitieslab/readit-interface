import { extend } from 'lodash';
import { apiRoot } from 'config.json';

import View from './../core/view';
import Model from './../core/model';
import feedbackTemplate from './feedback-template';

export default class FeedbackView extends View {
    feedbackUrl: string;
    wasSentSuccessfully: boolean;
    hasError: boolean;

    render(): this {
        this.$el.html(this.template(this));
        this.$('form').validate({
            errorClass: "help is-danger",
            rules: {
                subject: {
                    required: false,
                    maxlength: 150
                },
                feedback: "required"
            }
        });
        return this;
    }

    submit(event?: JQuery.TriggeredEvent) {
        if (event) event.preventDefault();
        if (this.$('form').valid()) {
            const subject = this.$('input[name="subject"]').val() as string,
                feedback = this.$('textarea[name="feedback"]').val() as string;

            new Model().save(
                { 'subject': subject, 'feedback': feedback },
                {
                    url: this.feedbackUrl,
                    success: (model, response, options) => {
                        this.success();
                    },
                    error: (model, response, options) => {
                        this.error(response);
                    }
                }
            );
        }
        return this;
    }

    reset(): this {
        this.wasSentSuccessfully = false;
        this.hasError = false;
        this.$el.trigger('reset');
        return this;
    }

    error(response: any): this {
        this.hasError = true;
        this.render();
        console.error(response);
        return this;
    }

    success(): this {
        this.wasSentSuccessfully = true;
        this.render();
        return this;
    }

    close(): this {
        this.reset();
        return this.trigger('close');
    }
}

extend(FeedbackView.prototype, {
    tagName: 'section',
    className: 'modal is-active',
    template: feedbackTemplate,
    events: {
        submit: 'submit',
        'click .modal-close': 'close',
        'click .btn-close': 'close',
    },
    feedbackUrl: `${apiRoot}feedback/`,
});
