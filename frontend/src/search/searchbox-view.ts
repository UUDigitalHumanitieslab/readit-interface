import { extend } from 'lodash';

import View from '../core/view';
import searchboxTemplate from './searchbox-template';

export default class SearchboxView extends View {    
    template = searchboxTemplate;

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
    events: {
        "click .button": "search",
    }
});