import { extend } from 'lodash';

import View from "../core/view";

import sourceList from '../global/source-list';
import itemList from '../global/item-list';

import landingTemplate from './landing-template';

export default class LandingView extends View {
    initialize() {
        this.render();
    }

    render() {
        this.$el.html(this.template(this));
        return this;
    }
}

extend(LandingView.prototype, {
    tagName: 'section',
    template: landingTemplate,
});
