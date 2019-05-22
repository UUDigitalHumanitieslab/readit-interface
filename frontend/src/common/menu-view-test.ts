import { enableI18n } from '../test-util';

import MenuView from './menu-view';

describe('MenuView', function() {
    beforeAll(enableI18n);
    beforeEach(function() {
        this.view = new MenuView();
    });
    it('renders a simple greeting message', function() {
        expect(this.view.render().$el.html()).toContain('Hello');
    });
});
