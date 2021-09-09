import { enableI18n } from '../test-util';

import User from '../common-user/user-model';
import MenuView from './menu-view';

describe('MenuView', function() {
    beforeAll(enableI18n);
    beforeEach(function() {
        this.view = new MenuView({model: new User()});
    });
    it('renders contains button to explore', function() {
        expect(this.view.render().$el.html()).toContain('Browse');
    });
});
