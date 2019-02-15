import { extend } from 'lodash';

import View from '../core/view';
import searchboxTemplate from './searchbox-template';

export default class SearchboxView extends View { 
    render() {
        this.$el.html(this.template());
        return this;
    }

    search() {
       console.log(this.$('.input').val()) 
    }
}

extend(SearchboxView.prototype, {
    tagName: 'div',
    className: 'searchbox',
    template: searchboxTemplate,
    events: {
        "click .button": "search",
    }
});