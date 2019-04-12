import { extend } from 'lodash';
import * as _ from 'underscore';
import View from '../core/view';

import AnnotationDeleteTemplate from './anno-deletion-template';
import Annotation from '../models/annotation';


export default class AnnotationDeleteView extends View {
    constructor(private annotation: Annotation) {
        super();
    }

    render(): View {
        this.$el.html(this.template({
            annotation: this.annotation.toJSON()
        }));

        this.show();

        return this;
    }

    initialize(): void {

    }

    show(): void {
        this.$el.addClass('is-active');
    }

    hide(): void {
        this.$el.removeClass('is-active');
    }

    confirm(): void {
        this.hide();
        this.trigger('confirmed');
    }

    cancel(): void {
        this.hide();
    }
}
extend(AnnotationDeleteView.prototype, {
    tagName: 'div',
    className: 'modal',
    template: AnnotationDeleteTemplate,
    events: {
        'click .deletion-modal-close': 'hide',
        'click .btnDelete': 'confirm',
        'click .btnCancel': 'cancel',
    }
});