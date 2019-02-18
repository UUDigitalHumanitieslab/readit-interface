import { history } from 'backbone';

import directionRouter from '../global/ex_direction-router';
import directionFsm from '../global/ex_direction-fsm';
import welcomeView from '../global/welcome-view';
import searchboxView from '../search/searchbox-view';
import exitView from '../global/ex_exit-view';
import footerView from '../global/footer-view';
import menuView from '../global/menu-view';
import SearchboxView from '../search/searchbox-view';

history.once('route', () => {
    menuView.render().$el.appendTo('#header');
    footerView.render().$el.appendTo('.footer');
});


directionRouter.on('route:arrive', () => directionFsm.handle('arrive'));
directionRouter.on('route:leave', () => directionFsm.handle('leave'));
directionRouter.on('route:login', () => directionFsm.handle('login'));



directionFsm.on('enter:arriving', () => {
    welcomeView.render().$el.appendTo('#main')    
});
directionFsm.on('exit:arriving', () => { 
    welcomeView.$el.detach();    
});

directionFsm.on('enter:leaving', () => exitView.render().$el.insertAfter('.hero-head'));
directionFsm.on('exit:leaving', () => exitView.$el.detach());
