import bb from 'backbone';

export default class ExampleView extends bb.View {
    render() {
        this.$el.html('<h1>Hello!</h1>');
        return this;
    }
}
