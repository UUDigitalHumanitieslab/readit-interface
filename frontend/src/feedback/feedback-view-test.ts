import { apiRoot } from 'config.json';
import FeedbackView from './feedback-view';

describe('FeedbackView', function() {
    beforeEach(function() {
        this.view = new FeedbackView();
        jasmine.Ajax.install();
    });

    afterEach(function() {
        jasmine.Ajax.uninstall();
    });

    it('renders a feedback form with buttons', function() {
        const view = this.view.render();
        expect(view.$('[name="subject"]').length).toBe(1);
        expect(view.$('[name="feedback"]').length).toBe(1);
        expect(view.$('button[type="submit"]').length).toBe(1);
        expect(view.$('button.btn-close[type="button"]').length).toBe(1);
    });

    it('submits to the correct backend endpoint', function() {
        const view = this.view.render();
        view.$('[name="subject"]').val('test 123');
        view.$('[name="feedback"]').val('feedback is awesome!');
        view.$('form').submit();
        expect(jasmine.Ajax.requests.count()).toBe(1);
        const request = jasmine.Ajax.requests.mostRecent();
        expect(request.url).toBe(`${apiRoot}feedback/`);
    });
});
