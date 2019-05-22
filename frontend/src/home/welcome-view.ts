import { extend } from 'lodash';
import View from '../core/view';
import DirectionRouter from '../global/direction-router';
import searchboxView from '../global/searchbox';

import welcomeTemplate from './welcome-template';

export default class WelcomeView extends View {
    render() {
        this.$el.html(this.template(this));

        this.$('.welcome-image').append(searchboxView.render().$el)
        searchboxView.on("searchClicked", this.search)

        return this;
    }

    search(query: string, queryfields: string = 'all') {
        // var url = encodeURI(`search/?query=${query}&queryfields=${queryfields}`);
        // DirectionRouter.navigate(url, { trigger: true });
        console.log('searching! (not implemented yet)');
    }
}

extend(WelcomeView.prototype, {
    tagName: 'section',
    template: welcomeTemplate
});
