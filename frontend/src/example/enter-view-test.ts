import { i18nPromise } from '../test-util';

import EnterView from './enter-view';
import Person from './person-model';

describe('EnterView', function() {
    beforeEach(function() {
        this.view = new EnterView({model: new Person()});
    });
    it('renders a simple greeting message', async function() {
        await i18nPromise;
        expect(this.view.render().$el.html()).toContain('Alex');
    });
});
