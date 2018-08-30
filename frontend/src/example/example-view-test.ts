import { i18nPromise } from '../test-util';

import ExampleView from './example-view';

describe('ExampleView', function() {
    beforeEach(function() {
        this.view = new ExampleView();
    });
    it('renders a simple greeting message', async function(done) {
        await i18nPromise;
        expect(this.view.render().$el.html()).toContain('Alex');
        done();
    });
});
