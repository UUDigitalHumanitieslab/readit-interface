import { extend } from 'lodash';

import View from '../core/view';
import menuTemplate from './menu-template';

export default class MenuView extends View {
    template = menuTemplate;
    render() {
        this.$el.html(this.template(this.model.toJSON()));     
        return this;
    }

    expandHamburger(){
        let $hamburgers = this.$el.find(".navbar-burger");
        let target = $hamburgers[0].dataset.target;
        let $target = document.getElementById(target);
        $hamburgers[0].classList.toggle('is-active');
        $target.classList.toggle('is-active');
    }
}

extend(MenuView.prototype, {
    tagName: 'header',
    className: 'hero-head',
    events: {
        "click .navbar-burger": "expandHamburger",
    }
});