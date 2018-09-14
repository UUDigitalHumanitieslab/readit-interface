import View from '../core/view';
import exampleTemplate from './example-template';

export default class ExampleView extends View {
    template = exampleTemplate;
    render() {
        this.$el.html(this.template({name: 'Alex'}));
        return this;
    }
}
