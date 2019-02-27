import { extend } from 'lodash';
import View from '../../core/view';
import searchboxTemplate from './searchbox-template';

export default class SearchboxView extends View {
    render() {        
        this.$el.html(this.template(this));
        return this;
    }

    onKeyUp(e) {
        if (e.keyCode == 13) {
            this.search(e);
        }
    }

    initialize() {

    }

    search(event: any) {
        event.preventDefault();
        var query = this.$('.input').val();
        this.trigger("searchClicked", query)
    }
}

extend(SearchboxView.prototype, {
    tagName: 'div',
    className: 'searchbox',
    template: searchboxTemplate,
    events: {
        "click .button": "search",
        "keyup input": "onKeyUp",
    }
});