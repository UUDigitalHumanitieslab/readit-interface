import { history } from 'backbone';

import directionRouter from '../global/ex_direction-router';
import directionFsm from '../global/ex_direction-fsm';
import welcomeView from '../global/welcome-view';
import exitView from '../global/ex_exit-view';
import footerView from '../global/footer-view';
import menuView from '../global/menu-view';
import searchView from '../global/search-view';
import annotateView from '../global/annotate-view';


history.once('route', () => {
    menuView.render().$el.appendTo('#header');
    footerView.render().$el.appendTo('.footer');
});

directionRouter.on('route:arrive', () => directionFsm.handle('arrive'));
directionRouter.on('route:leave', () => directionFsm.handle('leave'));
directionRouter.on('route:login', () => directionFsm.handle('login'));
directionRouter.on('route:search', () => directionFsm.handle('search'));
directionRouter.on('route:annotate', () => directionFsm.handle('annotate'));


directionFsm.on('enter:arriving', () => {
    welcomeView.render().$el.appendTo('#main')    
});
directionFsm.on('exit:arriving', () => { 
    welcomeView.$el.detach();    
});

directionFsm.on('enter:searching', () => {
    searchView.render().$el.appendTo('#main')
});

directionFsm.on('exit:searching', () => {
    searchView.$el.detach();
});

directionFsm.on('enter:annotating', () => {
    annotateView.render().$el.appendTo('#main')
});

directionFsm.on('exit:annotating', () => {
    annotateView.$el.detach();
});

directionFsm.on('enter:leaving', () => exitView.render().$el.insertAfter('.hero-head'));
directionFsm.on('exit:leaving', () => exitView.$el.detach());
