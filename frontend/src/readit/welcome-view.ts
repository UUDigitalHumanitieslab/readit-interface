import { extend } from 'lodash';
import { ViewOptions as BaseOpt } from 'backbone';

import Model from '../core/model';
import View from '../core/view';
import welcomeTemplate from './welcome-template';

export interface ViewOptions extends BaseOpt<Model> {
    searchBox: View;
}

export default class WelcomeView extends View {
    searchboxView: View;

    constructor(options: ViewOptions) {
        super(options);
        this.searchboxView = options.searchBox;
    }

    render() {
        this.$el.html(this.template(this));

        this.$('.welcome-image').append(this.searchboxView.render().$el)
        this.searchboxView.on("searchClicked", this.search)

        return this;
    }

    search(query: string, queryfields: string = 'all') {
        // var url = encodeURI(`search/?query=${query}&queryfields=${queryfields}`);
        console.log('searching! (not implemented yet)');
    }
}

extend(WelcomeView.prototype, {
    tagName: 'section',
    template: welcomeTemplate,
});
