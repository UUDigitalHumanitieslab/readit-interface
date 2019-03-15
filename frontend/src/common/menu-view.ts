import { extend } from 'lodash';

import View from '../core/view';
import menuTemplate from './menu-template';
import DirectionRouter from '../global/ex_direction-router';

export default class MenuView extends View {    
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

    annotate(): void {
        var url = encodeURI('annotate');
        DirectionRouter.navigate(url, { trigger: true });
    }

    toggleHamburger(){
        this.$('.navbar-burger, #navbarMenu').toggleClass('is-active');
    }
}

extend(MenuView.prototype, {
    tagName: 'header',
    className: 'hero-head',        
    template: menuTemplate,
    events: {
        "click .navbar-burger": "toggleHamburger",
        "click #login": "login",
        "click #logout": "logout",
        "click #annotate": "annotate",
    }
});