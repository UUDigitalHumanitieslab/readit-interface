import { history } from 'backbone';

import footerView from '../global/footer-view';
import menuView from '../global/menu-view';
import welcomeView from '../global/welcome-view';

import directionRouter from '../global/direction-router';
import directionFsm from '../global/direction-fsm';

history.once('route', () => {
    menuView.render().$el.appendTo('#header');
    footerView.render().$el.appendTo('.footer');
});

directionRouter.on('route:arrive', () => directionFsm.handle('arrive'));
directionRouter.on('route:leave', () => directionFsm.handle('leave'));

directionFsm.on('enter:arriving', () => {
    welcomeView.render().$el.appendTo('#main');
});
directionFsm.on('exit:arriving', () => {
    welcomeView.$el.detach();
});
