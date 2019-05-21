import { enableI18n } from '../test-util';

import MenuView from './menu-view';
import Person from '../example/person-model';

describe('MenuView', function() {
    beforeAll(enableI18n);
    beforeEach(function() {
        this.view = new MenuView({model: new Person()});
    });
    it('renders a simple greeting message', function() {
        expect(this.view.render().$el.html()).toContain('Alex');
    });
});
