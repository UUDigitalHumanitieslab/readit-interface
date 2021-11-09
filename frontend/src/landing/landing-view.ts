import { extend } from 'lodash';

import View from "../core/view";
import userChannel from '../common-user/user-radio';

import landingTemplate from './landing-template';

export default class LandingView extends View {
    initialize() {
        this.render().listenTo(this.model, 'change', this.render);
    }

    render() {
        const user = userChannel.request('user').get('username') || 'guest';
        const data = extend({ user }, this.model.attributes);
        this.$el.html(this.template(data));
        return this;
    }
}

extend(LandingView.prototype, {
    tagName: 'section',
    className: 'section welcome',
    template: landingTemplate,
});
