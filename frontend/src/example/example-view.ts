import * as bb from 'backbone';
import exampleTemplate from './example-template';

export default class ExampleView extends bb.View<bb.Model> {
    template = exampleTemplate;
    render() {
        this.$el.html(this.template({name: 'Alex'}));
        return this;
    }
}
