import { history } from 'backbone';

import directionRouter from '../global/ex_direction-router';
import userFsm from '../global/user-fsm';
import exitView from '../global/ex_exit-view';
import footerView from '../global/footer-view';
import menuView from '../global/menu-view';

import annotateWelcomeView from '../global/annotate-welcome-view';


history.once('route', () => {
    menuView.render().$el.appendTo('#header');
    footerView.render().$el.appendTo('.footer');
});

directionRouter.on('route:arrive', () => userFsm.handle('arrive'));
directionRouter.on('route:leave', () => userFsm.handle('leave'));
userFsm.on('enter:arriving', () => annotateWelcomeView.render().$el.appendTo('main'));
userFsm.on('exit:arriving', () => annotateWelcomeView.$el.detach());
userFsm.on('enter:leaving', () => exitView.render().$el.appendTo('main'));
userFsm.on('exit:leaving', () => exitView.$el.detach());
