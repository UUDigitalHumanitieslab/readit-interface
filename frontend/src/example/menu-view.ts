import View from '../core/view';
import menuTemplate from './menu-template';

export default class MenuView extends View {
    template = menuTemplate;
    render() {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    }
}
