import { extend } from 'lodash';
import View from './../core/view';

import Node from './../jsonld/node';
import uploadSourceTemplate from './upload-source-template';

export default class UploadSourceFormView extends View {
    isSuccess: boolean;
    hasError: boolean;

    /**
     * Class to add to invalid inputs. Note that this is not
     * the same as the class added to the validate method by default:
     * that is for labels and includes the class 'help' as well.
     * These two are separated to integrate smoothly with Bulma.
     */
    errorClassInputs: string = "is-danger";

    initialize(): this {
        let self = this;

        this.$el.validate({
            errorClass: "help is-danger",
            rules: {
                source: { required: true, extension: "txt" },
                language: { required: true },
                type: { required: true },
                pubdate: { required: true, dateISO: true },
                url: { url: true }
            },
            errorPlacement: function (error, element) {
                let parent = element.parent();
                if (parent.hasClass('has-helptext')) {
                    let field = element.closest('.field');
                    error.insertBefore(field.children().last());
                }
                else {
                    error.appendTo(parent);
                }
            },
            highlight: function (element, errorClass) {
                let elem = $(element);
                let parent = elem.parent();
                if (parent.hasClass('select')) parent.addClass(self.errorClassInputs);
                else elem.addClass(self.errorClassInputs);
            },
            unhighlight: function (element, errorClass) {
                let elem = $(element);
                let parent = elem.parent();
                if (parent.hasClass('select')) parent.removeClass(self.errorClassInputs);
                else elem.removeClass(self.errorClassInputs);
            }
        });

        return this;
    }

    render(): this {
        this.$el.html(this.template(this));
        this.hideFeedback();
        let input = this.$('.file-input');
        let label = this.$('.filelabel');
        let name = this.$('.filename');

        input.on('change', () => {
            let files = (input.get(0) as HTMLInputElement).files;
            if (files.length === 0) {
                name.text('No file selected');
            } else {
                name.text(files[0].name);
                label.text('Change file...');
            }
            input.valid();
        });

        return this;
    }

    /**
     * Dynamically set the height for the view, based on the viewport height.
     */
    setHeight(height: number): void {
        this.$el.css('height', height);
    }

    onSaveClicked(event: JQueryEventObject): this {
        event.preventDefault();
        var self = this;
        if (this.$el.valid()) {
            let n = new Node();
            n.save(this.$el.get(0), { url: "/source/add/" });
            n.once('sync', () => {
                self.handleUploadSuccess();
            });
            n.once('error', () => {
                this.$('.form-feedback-bar.has-background-danger').show();
            });
        }
        return this;
    }

    reset(): this {
        this.$el.trigger('reset');
        return this;
    }

    handleUploadSuccess(): this {
        this.reset();
        this.$('.form-feedback-bar.has-background-success').show();
        return this;
    }

    onCancelClicked(event: JQueryEventObject): this {
        event.preventDefault();
        window.history.back();
        return this;
    }

    hideFeedback(event?: JQueryEventObject): this {
        this.$('.form-feedback-bar').hide();
        return this;
    }
}
extend(UploadSourceFormView.prototype, {
    tagName: 'form',
    className: 'section upload-source-form page',
    template: uploadSourceTemplate,
    events: {
        'submit': 'onSaveClicked',
        'click .btn-cancel': 'onCancelClicked',
        'click .input': 'hideFeedback',
    }
});
