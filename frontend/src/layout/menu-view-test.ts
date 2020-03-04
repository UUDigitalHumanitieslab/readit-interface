import { enableI18n } from '../test-util';

import Model from '../core/model';
import MenuView from './menu-view';

describe('MenuView', function() {
    beforeAll(enableI18n);
    beforeEach(function() {
        this.view = new MenuView({model: new Model()});
    });
    it('renders contains button to explore', function() {
        expect(this.view.render().$el.html()).toContain('Explore');
    });
});
