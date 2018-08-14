import * as bb from 'backbone';
import * as exampleTemplate from './example-template';

export default class ExampleView extends bb.View<bb.Model> {
    template = exampleTemplate;
    render() {
        this.$el.html(this.template());
        return this;
    }
}
