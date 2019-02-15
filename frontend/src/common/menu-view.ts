import { extend } from 'lodash';

import View from '../core/view';
import menuTemplate from './menu-template';
import User from './../models/user';

export default class MenuView extends View {    
    template = menuTemplate;
    
    render() {
        this.$el.html(this.template(this.model.attributes));
        return this;
    }

    initialize() {
        this.listenTo(this.model, 'change', this.render)
    }

    login() {
        this.model.set('name', 'Alex')
        return this;
    }

    logout() {
        this.model.set('name', undefined)
        return this;
    }

    toggleHamburger(){
        this.$('.navbar-burger, #navbarMenu').toggleClass('is-active');
    }
}

extend(MenuView.prototype, {
    tagName: 'header',
    className: 'hero-head',
    events: {
        "click .navbar-burger": "toggleHamburger",
        "click #login": "login",
        "click #logout": "logout"
    }
});