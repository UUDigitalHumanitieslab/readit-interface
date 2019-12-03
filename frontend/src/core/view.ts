import { bind } from 'lodash'
import { View as BView } from 'backbone';
import { TemplateDelegate } from 'handlebars';

import Model from './model';

/**
 * This is the base view class that all views in the application
 * should derive from, either directly or indirectly. If you want to
 * apply a customization to all views in the application, do it here.
 */
export default class View<M extends Model = Model> extends BView<M> {
    template: TemplateDelegate;
    extraLoggingInfo: any;

    constructor(options?) {
        super(options);

        if (window['DEBUGGING'])
            this.$el.on('click', bind(this.onBaseClick, this));
    }

    onBaseClick(event: JQueryEventObject): this {
        if (event.altKey) {
            this.logInfo();
        }
        return this;
    }

    logInfo(): this {
        if (this.cid == "view1") return this; // ignore internalLinkEnabler
        console.log(this);
        if (this.extraLoggingInfo) console.log(this.extraLoggingInfo);
        return this;
    }
}
