import { extend } from 'lodash';

import View from "../core/view";

import landingTemplate from './landing-template';

export default class LandingView extends View {
    initialize() {
        this.render().listenTo(this.model, 'change', this.render);
    }

    render() {
        this.$el.html(this.template(this.model.attributes));
        return this;
    }
}

extend(LandingView.prototype, {
    tagName: 'section',
    className: 'section welcome',
    template: landingTemplate,
});
