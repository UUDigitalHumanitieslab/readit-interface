import ExampleView from './example-view';

describe('ExampleView', function() {
    beforeEach(function() {
        this.view = new ExampleView();
    });
    it('renders a simple greeting message', function() {
        expect(this.view.render().$el.html()).toContain('Hello');
    });
});
