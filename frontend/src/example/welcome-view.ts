import { extend } from 'lodash';
import View from '../core/view';
import DirectionRouter from '../global/ex_direction-router';

import welcomeTemplate from './welcome-template';
import SearchboxView from './../search/search-box/searchbox-view';

export default class WelcomeView extends View {
    render() {
        this.$el.html(this.template(this));

        let searchboxView = new SearchboxView();
        this.$('.welcome-image').append(searchboxView.render().$el)
        searchboxView.on("searchClicked", this.search)
        
        return this;
    }

    search(query: string, queryfields: string = 'all') {
        event.preventDefault
        var url = encodeURI(`search/?queryfields=${queryfields}&query=${query}`);
        DirectionRouter.navigate(url, { trigger: true });
    }
}

extend(WelcomeView.prototype, {
    tagName: 'section',
    template: welcomeTemplate
});