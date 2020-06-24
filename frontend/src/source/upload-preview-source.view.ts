import { extend } from 'lodash';

import View from './../core/view';
import uploadPreviewSourceTemplate from './upload-preview-source-template';

export default class UploadPreviewSourceView extends View {
    render(): this {
        this.$el.html(this.template(this));
        return this;
    }

    onCloseClicked(): this {
        this.remove();
        return this;
    }
}

extend(UploadPreviewSourceView.prototype, {
    template: uploadPreviewSourceTemplate,
    className: 'page-overlay',
    events: {
        'click .btn-close': 'onCloseClicked'
    }
});