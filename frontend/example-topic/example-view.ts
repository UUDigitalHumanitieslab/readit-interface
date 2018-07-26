import * as bb from 'backbone';

export default class ExampleView extends bb.View<bb.Model> {
    render() {
        this.$el.html('<h1>Hello!</h1>');
        return this;
    }
}
