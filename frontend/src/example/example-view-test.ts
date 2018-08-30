import { i18nPromise } from '../global/i18n';

import ExampleView from './example-view';

describe('ExampleView', function() {
    beforeEach(function() {
        this.view = new ExampleView();
    });
    it('renders a simple greeting message', function(done) {
        i18nPromise.then(() => {
            expect(this.view.render().$el.html()).toContain('Alex');
            done();
        });
    });
});
