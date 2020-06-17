import { extend } from 'lodash';

import View from '../core/view';

import externalUrlTemplate from './external-url-template';

export default class ExternalUrl extends View {

    initialize() {
        this.render();
    }

    render(): this {
        this.$el.html(this.template(this));
        return this;
    }

    removeUrl(): this {
        this.trigger('remove', this.model);
        return this;
    }

    changeUrl(event): this {
        this.model.set('url', event.target.value);
        // this.trigger('change', this.model, event.target.value);
        return this;
    }

}

extend(ExternalUrl.prototype, {
    template: externalUrlTemplate,
    events: {
        'click .remove': 'removeUrl',
        'change input': 'changeUrl'
    }
})