import { extend } from 'lodash';

import View from '../core/view';
import menuTemplate from './menu-template';


export default class MenuView extends View {
    render() {
        console.log(this.model);
        this.$el.html(this.template({ username: this.model.get('username')}));
        return this;
    }

    initialize() {
        this.listenTo(this.model, 'change', this.render);
    }

    login() {
        return this;
    }

    logout() {
        return this.trigger('logout');
    }

    feedback() {
        return this.trigger('feedback');
    }

    annotate(): void {
        console.log('annotate clicked! (not implemented yet)');
    }

    toggleHamburger(){
        this.$('.navbar-burger, #navbarMenu').toggleClass('is-active');
    }
}

extend(MenuView.prototype, {
    tagName: 'header',
    template: menuTemplate,
    events: {
        "click .navbar-burger": "toggleHamburger",
        "click #logout": "logout",
        "click #feedback": "feedback",
    }
});
