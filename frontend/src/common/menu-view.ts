import { extend } from 'lodash';

import View from '../core/view';
import menuTemplate from './menu-template';
import DirectionRouter from '../global/direction-router';


export default class MenuView extends View {

    render() {
        this.$el.html(this.template({}));
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
    }
});