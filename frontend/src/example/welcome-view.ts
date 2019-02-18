import { extend } from 'lodash';

import View from '../core/view';
import welcomeTemplate from './welcome-template';
import SearchboxView from './../search/searchbox-view';

export default class WelcomeView extends View {
    searchboxView = undefined;

    render() {
        this.$el.html(this.template());
        this.searchboxView = new SearchboxView();
        this.$('.welcome-image').append(this.searchboxView.render().$el)
        return this;
    }
}

extend(WelcomeView.prototype, {
    tagName: 'section',
    template: welcomeTemplate
});