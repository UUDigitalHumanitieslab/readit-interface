import { history } from 'backbone';

import footerView from '../global/footer-view';
import menuView from '../global/menu-view';
import welcomeView from '../global/welcome-view';

import directionRouter from '../global/direction-router';
import userFsm from '../global/user-fsm';

history.once('route', () => {
    menuView.render().$el.appendTo('#header');
    footerView.render().$el.appendTo('.footer');
});

directionRouter.on('route:arrive', () => welcomeView.render().$el.appendTo('#main'));
directionRouter.on('route:leave', () => welcomeView.$el.detach());

// Uncomment the below to activate login (and comment out the above)
// directionRouter.on('route:arrive', () => userFsm.handle('arrive'));
// directionRouter.on('route:leave', () => userFsm.handle('leave'));

// userFsm.on('enter:arriving', () => welcomeView.render().$el.appendTo('#main'));
// userFsm.on('exit:arriving', () => welcomeView.$el.detach());
