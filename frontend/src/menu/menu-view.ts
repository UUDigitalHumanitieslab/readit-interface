import { extend } from 'lodash';

import View from '../core/view';
import menuTemplate from './menu-template';
import User from '../common-user/user-model';

export default class MenuView extends View {
    render() {
        this.$el.html(this.template({
            username: this.model.get('username'),
            uploadSources: (this.model as User).hasPermission('upload_source')
        }));
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

    toggleHamburger() {
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
        "click .navbar-item:not(.has-dropdown)": "toggleHamburger",
    }
});
